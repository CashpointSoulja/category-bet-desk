'use client';
import { useMemo, useState } from 'react';
import type { AssumptionKey, Assumptions, Ramp as RampT, Values } from '@/lib/engine';
import { bundleEconomics, oneWaySensitivity, ramp, twoWayGrid } from '@/lib/engine';
import { gbp, gbpShort, num } from '@/lib/format';

export function RampChart({ r, target }: { r: RampT; target: number }) {
  const W = 760, H = 240, L = 52, B = 26, T = 14;
  const monthlyTarget = target / 12;
  const max = Math.max(monthlyTarget * 1.15, ...r.months.map((m) => m.gmv));
  const bw = (W - L - 8) / r.months.length;
  const y = (x: number) => T + (H - T - B) * (1 - x / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Monthly GMV for ${r.months.length} months against a ${gbpShort(monthlyTarget)} monthly target`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#eee8dc" />
            <text x={L - 6} y={y(t) + 4} textAnchor="end">{gbpShort(t)}</text>
          </g>
        ))}
        {r.months.map((m, i) => (
          <g key={m.month}>
            <rect className={`bar ${r.monthReachingTarget !== null && m.month >= r.monthReachingTarget ? 'hit' : m.constraint === 'supply' ? 'supply' : ''}`} x={L + i * bw + 2} width={Math.max(bw - 4, 1)} y={y(m.gmv)} height={Math.max(y(0) - y(m.gmv), 0)} rx={2}>
              <title>{`Month ${m.month}: ${gbp(m.gmv, 0)} GMV, ${num(m.bundles)} bundles, ${m.constraint}-bound`}</title>
            </rect>
            {(m.month === 1 || m.month % 3 === 0) && (
              <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle">M{m.month}</text>
            )}
          </g>
        ))}
        <line className="target" x1={L} x2={W} y1={y(monthlyTarget)} y2={y(monthlyTarget)} />
        <text className="target-label" x={W - 4} y={y(monthlyTarget) - 6} textAnchor="end">{gbpShort(target)}/yr run-rate = {gbpShort(monthlyTarget)}/mo</text>
      </svg>
      <figcaption className="chart-legend">
        <span><i className="sw" style={{ background: 'var(--yellow)' }} />Demand-bound month</span>
        <span><i className="sw" style={{ background: 'var(--orange)' }} />Supply-bound month</span>
        <span><i className="sw" style={{ background: 'var(--black)' }} />At or above target run-rate</span>
      </figcaption>
    </figure>
  );
}

export function RampTable({ r }: { r: RampT }) {
  const show = r.months.filter((m) => m.month === 1 || m.month % 3 === 0 || m.month === r.monthReachingTarget);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th className="r">Suppliers</th>
            <th className="r">Active buyers</th>
            <th className="r">Bundles sold</th>
            <th>Bound by</th>
            <th className="r">GMV</th>
            <th className="r">Run-rate</th>
            <th className="r">Contribution after CAC</th>
          </tr>
        </thead>
        <tbody>
          {show.map((m) => (
            <tr key={m.month} style={m.month === r.monthReachingTarget ? { background: 'var(--amber-bg)' } : undefined}>
              <td>M{m.month}</td>
              <td className="r">{num(m.suppliers)}</td>
              <td className="r">{num(m.activeBuyers)}</td>
              <td className="r">{num(m.bundles)}</td>
              <td>{m.constraint}</td>
              <td className="r">{gbpShort(m.gmv)}</td>
              <td className="r">{gbpShort(m.annualRunRate)}</td>
              <td className={`r ${m.contribution < 0 ? 'neg' : ''}`}>{gbpShort(m.contribution)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ONE_WAY_KEYS: AssumptionKey[] = ['takeRate', 'supplierCostB', 'gradeA', 'shippingCharged', 'freightPerKg', 'disputeRate', 'refundShare', 'gradingCostPerPiece', 'paymentCostPct', 'kgPerPiece'];

export function Tornado({ v, a }: { v: Values; a: Assumptions }) {
  const base = bundleEconomics(v).contribution;
  const rows = oneWaySensitivity(v, ONE_WAY_KEYS, 20);
  const lo = Math.min(...rows.map((r) => Math.min(r.atLow, r.atHigh)), base);
  const hi = Math.max(...rows.map((r) => Math.max(r.atLow, r.atHigh)), base);
  const x = (n: number) => ((n - lo) / (hi - lo || 1)) * 100;
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Contribution per bundle when each input moves 20% down or up</caption>
        <thead>
          <tr>
            <th>Input (±20%)</th>
            <th className="r">−20%</th>
            <th style={{ width: '38%' }}>Contribution / bundle</th>
            <th className="r">+20%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{a[r.key].label}</td>
              <td className={`r ${r.atLow < base ? 'neg' : 'pos'}`}>{gbp(r.atLow)}</td>
              <td>
                <div className="tornado-bar" aria-hidden>
                  <i className="lo" style={{ left: `${x(Math.min(r.atLow, base))}%`, width: `${Math.abs(x(r.atLow) - x(base))}%` }} />
                  <i className="hi" style={{ left: `${x(Math.min(r.atHigh, base))}%`, width: `${Math.abs(x(r.atHigh) - x(base))}%` }} />
                  <b style={{ left: `${x(base)}%` }} />
                </div>
              </td>
              <td className={`r ${r.atHigh < base ? 'neg' : 'pos'}`}>{gbp(r.atHigh)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tiny muted">Base case {gbp(base)}. Sorted by swing. Grade A share moves alone here, so the mix stops summing to 100%: read it as the isolated effect of a richer or poorer mix.</p>
    </div>
  );
}

type GridSpec = { id: string; title: string; xShort: string; yShort: string; xKey: AssumptionKey; xs: (b: number) => number[]; yKey: AssumptionKey; ys: (b: number) => number[]; metric: (v: Values) => number; fmt: (n: number) => string; good: (n: number) => 'good' | 'mid' | 'bad' };

const spread = (b: number, steps: number[]) => steps.map((s) => Math.max(0, +(b + s).toFixed(2)));

export function SensitivityGrids({ v, a }: { v: Values; a: Assumptions }) {
  const specs: GridSpec[] = useMemo(
    () => [
      {
        id: 'contrib',
        title: 'Contribution per bundle: take rate × dispute rate', xShort: 'Take rate', yShort: 'Dispute rate',
        xKey: 'takeRate', xs: (b) => spread(b, [-5, -2.5, 0, 2.5, 5]),
        yKey: 'disputeRate', ys: (b) => spread(b, [-4, -2, 0, 2, 4, 6]),
        metric: (x) => bundleEconomics(x).contribution,
        fmt: (n) => gbp(n),
        good: (n) => (n >= 12 ? 'good' : n >= 3 ? 'mid' : 'bad'),
      },
      {
        id: 'month',
        title: 'Month the bet hits £5M run-rate: buyers added × retention', xShort: 'Buyers added / mo', yShort: 'Retention',
        xKey: 'newBuyersPerMonth', xs: (b) => spread(b, [-200, -100, 0, 100, 200]),
        yKey: 'buyerRetention', ys: (b) => spread(b, [-10, -5, 0, 5, 10]).map((x) => Math.min(x, 99)),
        metric: (x) => ramp(x).monthReachingTarget ?? Infinity,
        fmt: (n) => (Number.isFinite(n) ? `M${n}` : '>24'),
        good: (n) => (n <= 18 ? 'good' : n <= 24 ? 'mid' : 'bad'),
      },
      {
        id: 'supply',
        title: 'Month the bet hits £5M run-rate: supplier pace × bundles per supplier', xShort: 'Suppliers added / mo', yShort: 'Bundles / supplier',
        xKey: 'suppliersAddedPerMonth', xs: (b) => spread(b, [-2, -1, 0, 1, 2]),
        yKey: 'bundlesPerSupplierMonth', ys: (b) => spread(b, [-30, -15, 0, 15, 30]),
        metric: (x) => ramp(x).monthReachingTarget ?? Infinity,
        fmt: (n) => (Number.isFinite(n) ? `M${n}` : '>24'),
        good: (n) => (n <= 18 ? 'good' : n <= 24 ? 'mid' : 'bad'),
      },
    ],
    [],
  );
  const [id, setId] = useState(specs[0].id);
  const s = specs.find((x) => x.id === id)!;
  const xs = s.xs(v[s.xKey]);
  const ys = s.ys(v[s.yKey]);
  const g = twoWayGrid(v, s.xKey, xs, s.yKey, ys, s.metric);
  const bg = { good: 'var(--green-bg)', mid: 'var(--amber-bg)', bad: 'var(--red-bg)' };
  return (
    <div>
      <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <strong>Table</strong>
        <select className="select" value={id} onChange={(e) => setId(e.target.value)}>
          {specs.map((x) => (
            <option key={x.id} value={x.id}>{x.title}</option>
          ))}
        </select>
      </label>
      <div className="table-wrap">
        <table className="heat">
          <caption className="sr-only">{s.title}</caption>
          <thead>
            <tr>
              <th className="axis">{s.yShort} ↓<br />{s.xShort} →</th>
              {xs.map((x) => (
                <th key={x}>{num(x, x % 1 ? 1 : 0)}{a[s.xKey].unit === '%' ? '%' : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {g.cells.map((row, i) => (
              <tr key={ys[i]}>
                <th className="axis">{num(ys[i], ys[i] % 1 ? 1 : 0)}{a[s.yKey].unit === '%' ? '%' : ''}</th>
                {row.map((c, j) => (
                  <td key={j} className={xs[j] === v[s.xKey] && ys[i] === v[s.yKey] ? 'base' : ''} style={{ background: bg[s.good(c)] }}>
                    {s.fmt(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny muted">Outlined cell is the current assumption set. Every cell is a full recalculation, so the table moves as you edit inputs.</p>
    </div>
  );
}
