// The problems inside a merged ticket, counted with the desk's own view (causes.ts, as CauseTable does):
// each report under its cause by tenant. A report the desk read as a one-day move (desk-notes.json)
// is a problem of its own, but stays counted where it is filed, like CauseTable's footnote.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day-move' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined): Problem {
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // Reports whose intake tag names a different cause than the one they belong to.
  mistagged: number;
  firstSeen: string;
  lastSeen: string;
  // Set on the one-day-move row: the problem its reports are counted under.
  countedUnder?: Problem[];
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r));
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const entries: [Problem, Report[]][] = [...by.entries()];
  if (moved.length) entries.push(['one-day-move', moved]);
  const groups = entries
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        mistagged: problem === 'one-day-move' ? 0 : rs.filter((r) => r.meta.intakeTag !== problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        countedUnder:
          problem === 'one-day-move' ? [...new Set(rs.map((r) => problemOf(r, tenantOf(r))))] : undefined,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: all.filter((r) => r.mergedInto === ticket).length, unique: merged.length, groups };
}
