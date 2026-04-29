import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import QRCode from "qrcode";
import { logger } from "./logger";
import {
  localAuthDir,
  persistAuthState,
  purgeAuthState,
  restoreAuthState,
} from "./auth-state-store";
import { ensureSessionBucket, getSupabase } from "./supabase";

export type SessionStatus =
  | "pending"
  | "qr_pendiente"
  | "conectando"
  | "conectado"
  | "desconectado"
  | "expirado"
  | "error";

interface BaileysSock {
  ev: {
    on: (event: string, cb: (data: unknown) => void) => void;
  };
  user?: { id?: string };
  logout: () => Promise<void>;
  end?: (err?: unknown) => void;
  sendMessage: (jid: string, content: { text: string }) => Promise<unknown>;
  ws?: { close?: () => void };
}

interface SessionEntry {
  tenantId: string;
  status: SessionStatus;
  qrDataUrl: string | null;
  phone: string | null;
  sock: BaileysSock | null;
  saveCreds: (() => Promise<void>) | null;
  closing: boolean;
  reconnectTimer: NodeJS.Timeout | null;
}

const sessions = new Map<string, SessionEntry>();

const MOCK_MODE =
  process.env["WA_WORKER_MOCK"] === "true" ||
  process.env["WA_WORKER_MOCK"] === "1";

let baileysModule: {
  default?: unknown;
  makeWASocket?: unknown;
  useMultiFileAuthState?: unknown;
  DisconnectReason?: Record<string, number>;
  fetchLatestBaileysVersion?: () => Promise<{ version: unknown }>;
} | null = null;

function loadBaileys(): typeof baileysModule {
  if (baileysModule || MOCK_MODE) return baileysModule;
  try {
    const req = createRequire(import.meta.url);
    baileysModule = req("@whiskeysockets/baileys");
    logger.info("Baileys loaded");
  } catch (err) {
    logger.warn({ err: String(err) }, "Baileys not installed, falling back to mock mode");
  }
  return baileysModule;
}

function isMock(): boolean {
  if (MOCK_MODE) return true;
  return loadBaileys() == null;
}

async function dbUpsertStatus(
  tenantId: string,
  patch: {
    status?: SessionStatus;
    qrCode?: string | null;
    phoneNumber?: string | null;
  },
): Promise<void> {
  const supabase = getSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update["status"] = patch.status;
  if (patch.qrCode !== undefined) update["qr_code"] = patch.qrCode;
  if (patch.phoneNumber !== undefined) update["phone_number"] = patch.phoneNumber;

  const { data: existing } = await supabase
    .from("tenant_whatsapp_sessions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("provider", "baileys")
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("tenant_whatsapp_sessions")
      .update(update)
      .eq("id", existing.id)
      .eq("tenant_id", tenantId);
  } else {
    await supabase.from("tenant_whatsapp_sessions").insert({
      tenant_id: tenantId,
      provider: "baileys",
      ...update,
    });
  }
}

export interface SessionPublicState {
  status: SessionStatus;
  qrDataUrl: string | null;
  phone: string | null;
  mock: boolean;
}

export function getSessionState(tenantId: string): SessionPublicState | null {
  const entry = sessions.get(tenantId);
  if (!entry) return null;
  return {
    status: entry.status,
    qrDataUrl: entry.qrDataUrl,
    phone: entry.phone,
    mock: isMock(),
  };
}

/** Start (or restart) a session for the tenant. Returns the immediate state. */
export async function startSession(tenantId: string): Promise<SessionPublicState> {
  await ensureSessionBucket();
  const existing = sessions.get(tenantId);
  if (existing && (existing.status === "conectado" || existing.status === "qr_pendiente")) {
    return getSessionState(tenantId)!;
  }

  const entry: SessionEntry = existing ?? {
    tenantId,
    status: "pending",
    qrDataUrl: null,
    phone: null,
    sock: null,
    saveCreds: null,
    closing: false,
    reconnectTimer: null,
  };
  entry.closing = false;
  entry.status = "conectando";
  entry.qrDataUrl = null;
  sessions.set(tenantId, entry);
  await dbUpsertStatus(tenantId, { status: "conectando", qrCode: null });

  if (isMock()) {
    return startMockSession(entry);
  }

  return startRealSession(entry).catch((err) => {
    logger.error({ err, tenantId }, "startSession failed");
    entry.status = "error";
    void dbUpsertStatus(tenantId, { status: "error" });
    return getSessionState(tenantId)!;
  });
}

async function startMockSession(entry: SessionEntry): Promise<SessionPublicState> {
  const fakePayload = `wa-mock://${entry.tenantId}/${Date.now()}`;
  const dataUrl = await QRCode.toDataURL(fakePayload, { margin: 1, width: 256 });
  entry.qrDataUrl = dataUrl;
  entry.status = "qr_pendiente";
  await dbUpsertStatus(entry.tenantId, {
    status: "qr_pendiente",
    qrCode: dataUrl,
  });
  logger.info({ tenantId: entry.tenantId }, "mock QR issued");
  return getSessionState(entry.tenantId)!;
}

async function startRealSession(entry: SessionEntry): Promise<SessionPublicState> {
  const mod = loadBaileys();
  if (!mod) throw new Error("Baileys not available");

  const dir = localAuthDir(entry.tenantId);
  await mkdir(dir, { recursive: true });
  await restoreAuthState(entry.tenantId);

  const useMultiFileAuthState = mod.useMultiFileAuthState as unknown as (
    folder: string,
  ) => Promise<{
    state: unknown;
    saveCreds: () => Promise<void>;
  }>;
  const makeWASocket =
    (mod.default as unknown as (opts: unknown) => BaileysSock) ??
    (mod.makeWASocket as unknown as (opts: unknown) => BaileysSock);
  const fetchLatest = mod.fetchLatestBaileysVersion;

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  let version: unknown = undefined;
  if (typeof fetchLatest === "function") {
    try {
      const v = await fetchLatest();
      version = v.version;
    } catch (err) {
      logger.warn({ err }, "fetchLatestBaileysVersion failed");
    }
  }

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Cecilia", "Chrome", "120.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    ...(version ? { version } : {}),
  });

  entry.sock = sock;
  entry.saveCreds = saveCreds;

  sock.ev.on("creds.update", () => {
    saveCreds()
      .then(() => persistAuthState(entry.tenantId))
      .catch((err: unknown) =>
        logger.warn({ err, tenantId: entry.tenantId }, "creds persist failed"),
      );
  });

  sock.ev.on("connection.update", (raw: unknown) => {
    const u = raw as {
      qr?: string;
      connection?: string;
      lastDisconnect?: { error?: { output?: { statusCode?: number } } };
    };
    if (u.qr) {
      void QRCode.toDataURL(u.qr, { margin: 1, width: 256 }).then((dataUrl) => {
        entry.qrDataUrl = dataUrl;
        entry.status = "qr_pendiente";
        void dbUpsertStatus(entry.tenantId, {
          status: "qr_pendiente",
          qrCode: dataUrl,
        });
      });
    }
    if (u.connection === "open") {
      entry.qrDataUrl = null;
      entry.status = "conectado";
      entry.phone =
        typeof sock.user?.id === "string" ? sock.user.id.split(":")[0] ?? null : null;
      void dbUpsertStatus(entry.tenantId, {
        status: "conectado",
        qrCode: null,
        phoneNumber: entry.phone,
      });
      void persistAuthState(entry.tenantId);
    }
    if (u.connection === "close") {
      const code = u.lastDisconnect?.error?.output?.statusCode;
      const loggedOut = mod.DisconnectReason?.["loggedOut"] ?? 401;
      if (code === loggedOut) {
        entry.status = "expirado";
        void dbUpsertStatus(entry.tenantId, { status: "expirado", qrCode: null });
        void purgeAuthState(entry.tenantId);
        sessions.delete(entry.tenantId);
        return;
      }
      entry.status = "desconectado";
      void dbUpsertStatus(entry.tenantId, { status: "desconectado" });
      if (!entry.closing && !entry.reconnectTimer) {
        entry.reconnectTimer = setTimeout(() => {
          entry.reconnectTimer = null;
          void startSession(entry.tenantId);
        }, 5_000);
      }
    }
  });

  return getSessionState(entry.tenantId)!;
}

export async function stopSession(tenantId: string): Promise<void> {
  const entry = sessions.get(tenantId);
  if (!entry) {
    await dbUpsertStatus(tenantId, { status: "desconectado", qrCode: null });
    return;
  }
  entry.closing = true;
  if (entry.reconnectTimer) {
    clearTimeout(entry.reconnectTimer);
    entry.reconnectTimer = null;
  }
  if (entry.sock) {
    try {
      await entry.sock.logout();
    } catch (err) {
      logger.warn({ err, tenantId }, "logout failed");
      try {
        entry.sock.end?.(undefined);
      } catch {}
    }
  }
  await purgeAuthState(tenantId);
  sessions.delete(tenantId);
  await dbUpsertStatus(tenantId, { status: "desconectado", qrCode: null });
}

export async function sendText(
  tenantId: string,
  to: string,
  text: string,
): Promise<{ ok: boolean; reason?: string }> {
  const entry = sessions.get(tenantId);
  if (isMock()) {
    logger.info({ tenantId, to, text }, "mock sendText");
    return { ok: true };
  }
  if (!entry || entry.status !== "conectado" || !entry.sock) {
    return { ok: false, reason: "not_connected" };
  }
  const jid = toJid(to);
  try {
    await entry.sock.sendMessage(jid, { text });
    return { ok: true };
  } catch (err) {
    logger.warn({ err, tenantId, to }, "sendMessage threw");
    return { ok: false, reason: String(err) };
  }
}

export function toJid(phone: string): string {
  if (phone.includes("@")) return phone;
  const clean = phone.replace(/\D+/g, "");
  return `${clean}@s.whatsapp.net`;
}

/** Internal: inject a fake message for tests / mock. */
export function _emitMockInbound(
  tenantId: string,
  from: string,
  text: string,
): void {
  // hook used by test/router; real flow uses sock.ev "messages.upsert".
  void mockInboundHandlers.get(tenantId)?.(from, text);
}

export const mockInboundHandlers = new Map<
  string,
  (from: string, text: string) => Promise<void>
>();

export function _setMockInboundHandler(
  tenantId: string,
  fn: (from: string, text: string) => Promise<void>,
): void {
  mockInboundHandlers.set(tenantId, fn);
}

export function _resetSessions(): void {
  sessions.clear();
  mockInboundHandlers.clear();
}

export function isMockMode(): boolean {
  return isMock();
}
