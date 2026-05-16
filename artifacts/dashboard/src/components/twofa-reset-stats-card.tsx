import { useMemo, useState } from "react";
import {
  useListTwofaResetStats,
  type TwofaResetStatsCombo,
  ListTwofaResetStatsWindowHours,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserCog,
} from "lucide-react";

const WINDOW_OPTIONS: ReadonlyArray<{
  value: 1 | 24 | 168;
  label: string;
  short: string;
}> = [
  { value: 1, label: "Última hora", short: "1h" },
  { value: 24, label: "Últimas 24 horas", short: "24h" },
  { value: 168, label: "Últimos 7 días", short: "7d" },
];

type SortKey = "count" | "lastActivityAt";
type SortDir = "asc" | "desc";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return iso;
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "hace segundos";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

function severityForCount(count: number): "outline" | "secondary" | "destructive" {
  if (count >= 10) return "destructive";
  if (count >= 3) return "secondary";
  return "outline";
}

function sortCombos(
  combos: ReadonlyArray<TwofaResetStatsCombo>,
  sortKey: SortKey,
  sortDir: SortDir,
): TwofaResetStatsCombo[] {
  const copy = [...combos];
  copy.sort((a, b) => {
    let cmp = 0;
    if (sortKey === "count") {
      cmp = a.count - b.count;
      if (cmp === 0) {
        cmp =
          new Date(a.lastActivityAt).getTime() -
          new Date(b.lastActivityAt).getTime();
      }
    } else {
      cmp =
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime();
      if (cmp === 0) cmp = a.count - b.count;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
  return copy;
}

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  className?: string;
}

function SortableHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
  className,
}: SortableHeaderProps) {
  const isActive = active === sortKey;
  const Icon = !isActive ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        data-testid={`twofa-stats-sort-${sortKey}`}
        aria-sort={
          isActive
            ? dir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

export function TwofaResetStatsCard() {
  const [windowHours, setWindowHours] = useState<1 | 24 | 168>(24);
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const windowParam: ListTwofaResetStatsWindowHours = windowHours;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useListTwofaResetStats({ windowHours: windowParam });

  const sortedCombos = useMemo(() => {
    if (!data?.combos) return [];
    return sortCombos(data.combos, sortKey, sortDir);
  }, [data, sortKey, sortDir]);

  const totals = useMemo(() => {
    if (!data?.combos) return { count: 0, suppressed: 0, sent: 0 };
    let count = 0;
    let suppressed = 0;
    let sent = 0;
    for (const c of data.combos) {
      count += c.count;
      suppressed += c.suppressedCount;
      sent += c.sentCount;
    }
    return { count, suppressed, sent };
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const windowLabel =
    WINDOW_OPTIONS.find((o) => o.value === windowHours)?.short ?? "24h";

  return (
    <Card data-testid="card-twofa-reset-stats">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Abuso de reset 2FA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Combos <span className="font-mono">operator+target</span> con más
          alertas de reset 2FA (enviadas o silenciadas por throttle) en la
          ventana elegida. Útil para detectar scripts o atacantes que repiten
          el mismo intento.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-wrap items-end gap-3 mb-4"
          data-testid="twofa-stats-controls"
        >
          <div className="space-y-1">
            <Label
              htmlFor="twofa-stats-window"
              className="text-xs text-muted-foreground"
            >
              Ventana de tiempo
            </Label>
            <Select
              value={String(windowHours)}
              onValueChange={(v) => {
                const n = Number(v);
                if (n === 1 || n === 24 || n === 168) setWindowHours(n);
              }}
            >
              <SelectTrigger
                id="twofa-stats-window"
                className="h-9 w-44"
                data-testid="twofa-stats-window"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={String(o.value)}
                    data-testid={`twofa-stats-window-${o.value}`}
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9"
            data-testid="twofa-stats-refresh"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Refrescar
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" data-testid="twofa-stats-total-combos">
              {sortedCombos.length} combos
            </Badge>
            <Badge variant="outline" data-testid="twofa-stats-total-events">
              {totals.count} alertas ({totals.sent} enviadas / {totals.suppressed}{" "}
              silenciadas)
            </Badge>
            <span>Ventana: {windowLabel}</span>
          </div>
        </div>

        {isError ? (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
            data-testid="twofa-stats-error"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              No se pudo cargar la actividad:{" "}
              {error instanceof Error ? error.message : "error desconocido"}
            </span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2" data-testid="twofa-stats-loading">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedCombos.length === 0 ? (
          <div
            className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
            data-testid="twofa-stats-empty"
          >
            Sin alertas de reset 2FA en esta ventana. Buena señal.
          </div>
        ) : (
          <Table data-testid="twofa-stats-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Operador
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Target
                </TableHead>
                <SortableHeader
                  label="Alertas"
                  sortKey="count"
                  active={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                  className="w-32"
                />
                <SortableHeader
                  label="Última actividad"
                  sortKey="lastActivityAt"
                  active={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                  className="w-44"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCombos.map((combo) => {
                const rowKey = `${combo.operator}__${combo.targetEmail}`;
                return (
                  <TableRow
                    key={rowKey}
                    data-testid={`twofa-stats-row-${rowKey}`}
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="gap-1 font-mono text-xs"
                        data-testid={`twofa-stats-operator-${rowKey}`}
                      >
                        <UserCog className="h-3 w-3" />
                        {combo.operator}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      data-testid={`twofa-stats-target-${rowKey}`}
                    >
                      {combo.targetEmail || (
                        <span className="italic text-muted-foreground">
                          (sin target)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant={severityForCount(combo.count)}
                          data-testid={`twofa-stats-count-${rowKey}`}
                        >
                          {combo.count}
                        </Badge>
                        <span
                          className="text-[10px] text-muted-foreground"
                          data-testid={`twofa-stats-breakdown-${rowKey}`}
                        >
                          {combo.sentCount} enviadas /{" "}
                          {combo.suppressedCount} silenciadas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1 text-xs"
                        data-testid={`twofa-stats-last-${rowKey}`}
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span title={combo.lastActivityAt}>
                          {formatRelative(combo.lastActivityAt)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(combo.lastActivityAt).toLocaleString("es-PE")}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
