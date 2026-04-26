import { useEffect, useMemo, useState } from "react";
import {
  useListAuditLog,
  type AuditEntry,
  type AuditEntryMeta,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  ScrollText,
  Search,
  ShieldAlert,
  Terminal,
  UserCog,
  X,
  XCircle,
} from "lucide-react";

const CLI_RESET_ACTIONS = new Set([
  "auth.2fa.reset_cli",
  "auth.2fa.reset_cli.cancelled",
  "auth.2fa.reset_cli.failed",
]);

function isCliResetAction(action: string): boolean {
  return CLI_RESET_ACTIONS.has(action);
}

type CategoryValue =
  | "all"
  | "auth_2fa"
  | "reset_cli"
  | "reset_cli_ok"
  | "reset_cli_cancelled"
  | "reset_cli_failed"
  | "portal"
  | "modules"
  | "cecilia"
  | "security"
  | "admin"
  | "other";

interface CategoryDef {
  value: CategoryValue;
  label: string;
  match: (action: string) => boolean;
}

const CATEGORIES: ReadonlyArray<CategoryDef> = [
  { value: "all", label: "Todos los eventos", match: () => true },
  {
    value: "auth_2fa",
    label: "2FA (todos)",
    match: (a) => a.startsWith("auth.2fa"),
  },
  {
    value: "reset_cli",
    label: "Reset 2FA · CLI (todos)",
    match: (a) => isCliResetAction(a),
  },
  {
    value: "reset_cli_ok",
    label: "Reset 2FA · CLI exitoso",
    match: (a) => a === "auth.2fa.reset_cli",
  },
  {
    value: "reset_cli_cancelled",
    label: "Reset 2FA · CLI cancelado",
    match: (a) => a === "auth.2fa.reset_cli.cancelled",
  },
  {
    value: "reset_cli_failed",
    label: "Reset 2FA · CLI fallido",
    match: (a) => a === "auth.2fa.reset_cli.failed",
  },
  {
    value: "portal",
    label: "Portal (logins, registros)",
    match: (a) => a.startsWith("portal."),
  },
  {
    value: "modules",
    label: "Módulos",
    match: (a) => a.startsWith("module."),
  },
  {
    value: "cecilia",
    label: "Cecilia",
    match: (a) => a.startsWith("cecilia."),
  },
  {
    value: "security",
    label: "Seguridad (alertas/IP)",
    match: (a) => a.startsWith("security."),
  },
  {
    value: "admin",
    label: "Admin (backup, etc.)",
    match: (a) => a.startsWith("admin."),
  },
  {
    value: "other",
    label: "Otros",
    match: (a) =>
      !a.startsWith("auth.2fa") &&
      !a.startsWith("portal.") &&
      !a.startsWith("module.") &&
      !a.startsWith("cecilia.") &&
      !a.startsWith("security.") &&
      !a.startsWith("admin."),
  },
];

function metaString(meta: AuditEntryMeta, key: string): string | null {
  if (!meta || typeof meta !== "object") return null;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function actionVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (action === "auth.2fa.reset_cli.failed") return "destructive";
  if (action === "auth.2fa.reset_cli.cancelled") return "outline";
  if (action.startsWith("auth.2fa")) return "default";
  return "secondary";
}

function actionLabel(action: string): string {
  switch (action) {
    case "auth.2fa.reset_cli":
      return "Reset 2FA (CLI)";
    case "auth.2fa.reset_cli.cancelled":
      return "Reset 2FA cancelado";
    case "auth.2fa.reset_cli.failed":
      return "Reset 2FA falló";
    default:
      return action;
  }
}

const SEARCHABLE_META_KEYS = [
  "operator",
  "targetEmail",
  "email",
  "actorEmail",
  "userEmail",
];

function entryMatchesSearch(entry: AuditEntry, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  const meta = entry.meta ?? null;
  if (meta && typeof meta === "object") {
    const record = meta as Record<string, unknown>;
    for (const key of SEARCHABLE_META_KEYS) {
      const value = record[key];
      if (typeof value === "string" && value.toLowerCase().includes(needle)) {
        return true;
      }
    }
  }
  if (entry.entityId && String(entry.entityId).toLowerCase().includes(needle)) {
    return true;
  }
  if (entry.entityType && entry.entityType.toLowerCase().includes(needle)) {
    return true;
  }
  return false;
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cli = isCliResetAction(entry.action);
  const operator = cli ? metaString(entry.meta ?? null, "operator") : null;
  const targetEmail = cli
    ? metaString(entry.meta ?? null, "targetEmail")
    : null;
  const failed = entry.action === "auth.2fa.reset_cli.failed";

  return (
    <div
      className="border border-border rounded-md p-3 space-y-2"
      data-testid={`audit-row-${entry.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={actionVariant(entry.action)}
          className="font-mono text-[11px]"
          data-testid={`audit-action-${entry.id}`}
        >
          {failed ? (
            <ShieldAlert className="h-3 w-3 mr-1" />
          ) : cli ? (
            <Terminal className="h-3 w-3 mr-1" />
          ) : null}
          {actionLabel(entry.action)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(entry.createdAt).toLocaleString("es-PE")}
        </span>
      </div>

      {cli ? (
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground tracking-wide">
              Operador
            </span>
            {operator ? (
              <Badge
                variant="outline"
                className="gap-1 font-mono text-xs"
                data-testid={`audit-operator-${entry.id}`}
              >
                <UserCog className="h-3 w-3" />
                {operator}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                desconocido
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase text-muted-foreground tracking-wide">
              Usuario afectado
            </span>
            {targetEmail && (
              <span
                className="font-mono text-xs"
                data-testid={`audit-target-${entry.id}`}
              >
                {targetEmail}
              </span>
            )}
            {entry.entityId && (
              <span
                className="font-mono text-xs text-muted-foreground"
                data-testid={`audit-entity-${entry.id}`}
              >
                ID {entry.entityId}
              </span>
            )}
            {!targetEmail && !entry.entityId && (
              <span className="text-xs text-muted-foreground italic">
                sin dato
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {entry.entityType ? (
            <span>
              {entry.entityType}
              {entry.entityId ? ` · ${entry.entityId}` : ""}
            </span>
          ) : (
            <span>Sin entidad asociada</span>
          )}
          {entry.ip ? <span> · IP {entry.ip}</span> : null}
        </div>
      )}

      {failed && metaString(entry.meta ?? null, "error") && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{metaString(entry.meta ?? null, "error")}</span>
        </div>
      )}

      {entry.meta && (
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
            data-testid={`audit-toggle-${entry.id}`}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            {expanded ? "Ocultar detalles" : "Ver detalles"}
          </Button>
          {expanded && (
            <pre
              className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-[11px] font-mono"
              data-testid={`audit-meta-${entry.id}`}
            >
              {JSON.stringify(entry.meta, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

const FILTER_STORAGE_KEY = "axyntrax.security-events.filter";
const FILTER_QUERY_KEY = "ev";

function isCategoryValue(value: string): value is CategoryValue {
  return CATEGORIES.some((c) => c.value === value);
}

function readInitialCategory(): CategoryValue {
  if (typeof window === "undefined") return "all";
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(FILTER_QUERY_KEY);
    if (fromUrl && isCategoryValue(fromUrl)) return fromUrl;
  } catch {
    // ignore malformed URL
  }
  try {
    const fromStorage = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (fromStorage && isCategoryValue(fromStorage)) return fromStorage;
  } catch {
    // localStorage not accessible (private mode, etc.)
  }
  return "all";
}

const LIMIT_STEPS = [50, 200, 500] as const;
const INITIAL_LIMIT = LIMIT_STEPS[0];
const MAX_LIMIT = LIMIT_STEPS[LIMIT_STEPS.length - 1];

function nextLimitStep(current: number): number {
  for (const step of LIMIT_STEPS) {
    if (step > current) return step;
  }
  return MAX_LIMIT;
}

export function SecurityEventsCard() {
  const [limit, setLimit] = useState<number>(INITIAL_LIMIT);
  const { data, isLoading, isFetching, isError, error } = useListAuditLog({
    limit,
  });
  const [category, setCategory] = useState<CategoryValue>(readInitialCategory);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, category);
    } catch {
      // ignore quota / privacy errors
    }
    try {
      const url = new URL(window.location.href);
      const current = url.searchParams.get(FILTER_QUERY_KEY);
      if (category === "all") {
        if (current === null) return;
        url.searchParams.delete(FILTER_QUERY_KEY);
      } else {
        if (current === category) return;
        url.searchParams.set(FILTER_QUERY_KEY, category);
      }
      const next = url.pathname + url.search + url.hash;
      // replaceState avoids polluting browser history with each filter change.
      window.history.replaceState(window.history.state, "", next);
    } catch {
      // ignore URL update errors
    }
  }, [category]);

  const counts = useMemo(() => {
    const result = new Map<CategoryValue, number>();
    for (const c of CATEGORIES) result.set(c.value, 0);
    if (!data) return result;
    for (const entry of data) {
      for (const c of CATEGORIES) {
        if (c.match(entry.action)) {
          result.set(c.value, (result.get(c.value) ?? 0) + 1);
        }
      }
    }
    return result;
  }, [data]);

  const trimmedSearch = search.trim();

  const visibleEntries = useMemo(() => {
    if (!data) return [];
    const def = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];
    return data.filter(
      (entry) =>
        def.match(entry.action) && entryMatchesSearch(entry, trimmedSearch),
    );
  }, [data, category, trimmedSearch]);

  const filtersActive = category !== "all" || trimmedSearch.length > 0;
  const canLoadMore = limit < MAX_LIMIT;
  const loadingMore = isFetching && !isLoading;
  const handleLoadMore = () => {
    setLimit((current) => nextLimitStep(current));
  };

  return (
    <Card data-testid="card-audit-log">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Eventos de seguridad
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas {limit} entradas de auditoría. Filtra por tipo de evento o
          busca por operador / email afectado.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-3 mb-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          data-testid="audit-filter-bar"
        >
          <div className="space-y-1">
            <Label
              htmlFor="audit-filter-category"
              className="text-xs text-muted-foreground"
            >
              Tipo de evento
            </Label>
            <Select
              value={category}
              onValueChange={(value) => {
                const known = CATEGORIES.find((c) => c.value === value);
                setCategory(known ? known.value : "all");
              }}
            >
              <SelectTrigger
                id="audit-filter-category"
                className="h-9"
                data-testid="audit-filter-category"
              >
                <SelectValue placeholder="Todos los eventos" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    data-testid={`audit-filter-category-${c.value}`}
                  >
                    {c.label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({counts.get(c.value) ?? 0})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="audit-filter-search"
              className="text-xs text-muted-foreground"
            >
              Operador o email afectado
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="audit-filter-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ej: ana@axyntrax.com"
                className="h-9 pl-7 pr-7"
                data-testid="audit-filter-search"
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                  data-testid="audit-filter-search-clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {filtersActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 self-end"
              onClick={() => {
                setCategory("all");
                setSearch("");
              }}
              data-testid="audit-filter-reset"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-destructive">
            No se pudo cargar el audit log
            {error instanceof Error ? `: ${error.message}` : "."}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No hay eventos registrados todavía.
          </div>
        ) : visibleEntries.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 text-sm text-muted-foreground text-center py-6"
            data-testid="audit-empty-filtered"
          >
            <span>No hay eventos para este filtro.</span>
            {filtersActive && canLoadMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                data-testid="audit-load-older"
              >
                {loadingMore ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <History className="h-3.5 w-3.5 mr-1.5" />
                )}
                Buscar en eventos más antiguos (hasta {nextLimitStep(limit)})
              </Button>
            )}
            {filtersActive && !canLoadMore && (
              <span
                className="text-xs"
                data-testid="audit-load-older-exhausted"
              >
                Ya buscamos en las últimas {MAX_LIMIT} entradas y no
                encontramos coincidencias.
              </span>
            )}
          </div>
        ) : (
          <>
            <div
              className="flex flex-wrap items-center justify-between gap-2 mb-2"
              data-testid="audit-filter-summary"
            >
              <span className="text-xs text-muted-foreground">
                Mostrando {visibleEntries.length} de {data.length} eventos
                cargados{filtersActive ? " (filtrado)" : ""}
              </span>
              {canLoadMore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  data-testid="audit-load-older"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <History className="h-3 w-3 mr-1" />
                  )}
                  Cargar más antiguos ({nextLimitStep(limit)})
                </Button>
              )}
            </div>
            <div className="space-y-2" data-testid="audit-list">
              {visibleEntries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}

        {/* Quick reset filters preserved as compact shortcuts */}
        <div
          className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border"
          data-testid="audit-quick-filters"
          aria-label="Atajos rápidos de filtros"
        >
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground self-center mr-1">
            Atajos:
          </span>
          {(
            [
              {
                value: "reset_cli_ok",
                label: "OK",
                icon: CheckCircle2,
                testId: "filter-reset-ok",
              },
              {
                value: "reset_cli_cancelled",
                label: "Cancelado",
                icon: XCircle,
                testId: "filter-reset-cancelled",
              },
              {
                value: "reset_cli_failed",
                label: "Fallido",
                icon: ShieldAlert,
                testId: "filter-reset-failed",
              },
            ] as const
          ).map((s) => {
            const Icon = s.icon;
            const active = category === s.value;
            return (
              <Button
                key={s.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="h-6 px-2 text-[11px]"
                onClick={() => setCategory(s.value)}
                data-testid={s.testId}
                aria-pressed={active}
              >
                <Icon className="h-3 w-3 mr-1" />
                {s.label}
                <span className="ml-1 opacity-70">
                  ({counts.get(s.value) ?? 0})
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
