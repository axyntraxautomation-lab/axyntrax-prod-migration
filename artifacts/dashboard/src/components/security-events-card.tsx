import { useMemo, useState } from "react";
import {
  useListAuditLog,
  type AuditEntry,
  type AuditEntryMeta,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ScrollText,
  ShieldAlert,
  Terminal,
  UserCog,
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

type ResetFilter = "all" | "ok" | "cancelled" | "failed";

const RESET_FILTERS: ReadonlyArray<{
  value: ResetFilter;
  label: string;
  testId: string;
  icon: typeof Terminal | null;
  action: string | null;
}> = [
  {
    value: "all",
    label: "Todos",
    testId: "filter-all",
    icon: null,
    action: null,
  },
  {
    value: "ok",
    label: "Reset 2FA exitoso",
    testId: "filter-reset-ok",
    icon: CheckCircle2,
    action: "auth.2fa.reset_cli",
  },
  {
    value: "cancelled",
    label: "Reset 2FA cancelado",
    testId: "filter-reset-cancelled",
    icon: XCircle,
    action: "auth.2fa.reset_cli.cancelled",
  },
  {
    value: "failed",
    label: "Reset 2FA fallido",
    testId: "filter-reset-failed",
    icon: ShieldAlert,
    action: "auth.2fa.reset_cli.failed",
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

export function SecurityEventsCard() {
  const { data, isLoading, isError, error } = useListAuditLog({ limit: 50 });
  const [resetFilter, setResetFilter] = useState<ResetFilter>("all");

  const counts = useMemo(() => {
    const result: Record<ResetFilter, number> = {
      all: 0,
      ok: 0,
      cancelled: 0,
      failed: 0,
    };
    if (!data) return result;
    for (const entry of data) {
      result.all += 1;
      if (entry.action === "auth.2fa.reset_cli") result.ok += 1;
      else if (entry.action === "auth.2fa.reset_cli.cancelled")
        result.cancelled += 1;
      else if (entry.action === "auth.2fa.reset_cli.failed")
        result.failed += 1;
    }
    return result;
  }, [data]);

  const visibleEntries = useMemo(() => {
    if (!data) return [];
    const target = RESET_FILTERS.find((f) => f.value === resetFilter)?.action;
    if (!target) return data;
    return data.filter((entry) => entry.action === target);
  }, [data, resetFilter]);

  return (
    <Card data-testid="card-audit-log">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Eventos de seguridad
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas 50 entradas de auditoría. Los resets de 2FA hechos desde el
          CLI muestran al operador y al usuario afectado.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-wrap gap-2 mb-4"
          data-testid="audit-filter-bar"
          role="group"
          aria-label="Filtrar eventos por tipo"
        >
          {RESET_FILTERS.map((f) => {
            const active = resetFilter === f.value;
            const Icon = f.icon;
            return (
              <Button
                key={f.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                onClick={() => setResetFilter(f.value)}
                data-testid={f.testId}
                aria-pressed={active}
              >
                {Icon ? <Icon className="h-3 w-3 mr-1" /> : null}
                {f.label}
                <span className="ml-1.5 opacity-70">({counts[f.value]})</span>
              </Button>
            );
          })}
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
            className="text-sm text-muted-foreground text-center py-6"
            data-testid="audit-empty-filtered"
          >
            No hay eventos para este filtro.
          </div>
        ) : (
          <div className="space-y-2" data-testid="audit-list">
            {visibleEntries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
