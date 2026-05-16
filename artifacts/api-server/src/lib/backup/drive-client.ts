import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../logger";

/**
 * Cliente Google Drive para los backups del SaaS Cecilia.
 *
 * Usa el mismo patrón que `gmail-client.ts`: enruta vía
 * `connectors.proxy("google-drive", ...)`. Si la integración Drive no está
 * conectada en el entorno, las llamadas fallan con un mensaje claro y el
 * caller registra el backup como `estado='error'` sin tirar el job.
 *
 * Cuando el dueño AXYNTRAX conecte Drive (one-time OAuth desde el panel de
 * integraciones), el job arrancará automáticamente en la siguiente corrida
 * sin tocar código.
 */

export const BACKUP_FOLDER_NAME = "AXYNTRAX Backups SaaS";
export const RETENTION_KEEP = 30;

export class DriveNotConfiguredError extends Error {
  constructor(msg = "La integración Google Drive no está conectada en este entorno.") {
    super(msg);
    this.name = "DriveNotConfiguredError";
  }
}

const connectors = new ReplitConnectors();

function sanitizeDriveBody(s: string): string {
  return s
    .replace(/("?\b(?:access_token|refresh_token|id_token|client_secret|api_key|authorization|bearer)\b"?\s*[:=]\s*"?)[^"\s,}]+/gi, "$1[REDACTED]")
    .slice(0, 200);
}

interface DriveFileMin {
  id: string;
  name: string;
  createdTime?: string;
}

async function callDrive(
  path: string,
  init: { method: string; headers?: Record<string, string>; body?: string | Buffer | Uint8Array },
): Promise<Response> {
  try {
    const r = (await connectors.proxy("google-drive", path, init)) as unknown as Response;
    return r;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not.*configured|not.*connected|no integration|unauthorized/i.test(msg)) {
      throw new DriveNotConfiguredError(`Drive proxy: ${msg}`);
    }
    throw err;
  }
}

async function findOrCreateFolder(): Promise<string> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${BACKUP_FOLDER_NAME}' and trashed=false`,
  );
  const listResp = await callDrive(
    `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
    { method: "GET" },
  );
  if (!listResp.ok) {
    const txt = await listResp.text();
    if (listResp.status === 401 || listResp.status === 403) {
      throw new DriveNotConfiguredError(`Drive list HTTP ${listResp.status}: ${sanitizeDriveBody(txt)}`);
    }
    throw new Error(`Drive list HTTP ${listResp.status}: ${sanitizeDriveBody(txt)}`);
  }
  const parsed = (await listResp.json()) as { files?: DriveFileMin[] };
  const existing = parsed.files?.[0]?.id;
  if (existing) return existing;

  const createResp = await callDrive("/drive/v3/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!createResp.ok) {
    const txt = await createResp.text();
    throw new Error(`Drive create folder HTTP ${createResp.status}: ${sanitizeDriveBody(txt)}`);
  }
  const created = (await createResp.json()) as { id?: string };
  if (!created.id) throw new Error("Drive create folder: respuesta sin id");
  return created.id;
}

export interface DriveUploadResult {
  fileId: string;
  fileUrl: string;
  folderId: string;
}

export async function uploadBackupToDrive(opts: {
  filename: string;
  payload: Buffer;
  description?: string;
}): Promise<DriveUploadResult> {
  const folderId = await findOrCreateFolder();
  const boundary = `axyntrax-backup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const metadata = {
    name: opts.filename,
    parents: [folderId],
    description: opts.description ?? "AXYNTRAX SaaS Cecilia backup",
    mimeType: "application/gzip",
  };
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = Buffer.concat([
    Buffer.from(head, "utf8"),
    opts.payload,
    Buffer.from(tail, "utf8"),
  ]);
  const r = await callDrive(
    "/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Drive upload HTTP ${r.status}: ${sanitizeDriveBody(txt)}`);
  }
  const parsed = (await r.json()) as { id?: string; webViewLink?: string };
  if (!parsed.id) throw new Error("Drive upload: respuesta sin id");
  return {
    fileId: parsed.id,
    fileUrl: parsed.webViewLink ?? `https://drive.google.com/file/d/${parsed.id}`,
    folderId,
  };
}

export async function pruneOldBackups(folderId: string, keep: number = RETENTION_KEEP): Promise<{
  deleted: number;
  kept: number;
}> {
  const q = encodeURIComponent(
    `'${folderId}' in parents and trashed=false and mimeType='application/gzip'`,
  );
  let deleted = 0;
  let allFiles: DriveFileMin[] = [];
  let pageToken: string | undefined;
  do {
    const url = `/drive/v3/files?q=${q}&fields=files(id,name,createdTime),nextPageToken&orderBy=createdTime desc&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const r = await callDrive(url, { method: "GET" });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Drive list-for-prune HTTP ${r.status}: ${sanitizeDriveBody(txt)}`);
    }
    const parsed = (await r.json()) as { files?: DriveFileMin[]; nextPageToken?: string };
    allFiles = allFiles.concat(parsed.files ?? []);
    pageToken = parsed.nextPageToken;
  } while (pageToken);

  const toDelete = allFiles.slice(keep);
  for (const f of toDelete) {
    try {
      const r = await callDrive(`/drive/v3/files/${encodeURIComponent(f.id)}`, {
        method: "DELETE",
      });
      if (!r.ok && r.status !== 404) {
        const txt = await r.text();
        logger.warn(
          { fileId: f.id, status: r.status, body: sanitizeDriveBody(txt) },
          "[backup] no se pudo borrar archivo viejo de Drive",
        );
      } else {
        deleted += 1;
      }
    } catch (err) {
      logger.warn({ err, fileId: f.id }, "[backup] error borrando archivo viejo de Drive");
    }
  }
  return { deleted, kept: allFiles.length - deleted };
}
