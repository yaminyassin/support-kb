<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // issues: problem → its own ticket, { href, label }.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, { href: string; label: string }>> } =
    $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const NAME: Record<Problem, string> = {
    parser: 'shared parser reads month first',
    hint: 'booking-v3 hint says MM/DD/YYYY',
    'one-day-move': 'date moves by one day',
    unplaced: 'no tenant on file',
  };
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports in #{ticket} ({split.rows} rows in the export, {split.rows - split.unique} repeated) ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>seen</th><th>intake tag wrong</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="name">{NAME[g.problem]}</span></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants.length}</td>
        <td class="small">{channels(g.channels)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{g.mistagged}</td>
        <td>
          {#if issues[g.problem]}<a href={issues[g.problem]?.href}>{issues[g.problem]?.label}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .name, .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
