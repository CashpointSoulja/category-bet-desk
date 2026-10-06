import type { CategoryBet } from '@/lib/categories';
import type { BundleEconomics, GateResult, Ramp, Values } from '@/lib/model';
import { basisCounts, fmtMetric } from '@/lib/model';
import type { BetState } from '@/lib/state';
import { gbp, gbpShort, pct } from '@/lib/format';
import { asset } from '@/lib/asset';

const VERDICT_BG = { SCALE: '#e3f3e8', HOLD: '#fff3cf', KILL: '#fde7e4', INVALID: '#fde7e4' };

export function Memo({ bet, s, v, e, r, gate, date }: { bet: CategoryBet; s: BetState; v: Values; e: BundleEconomics; r: Ramp; gate: GateResult; date: string }) {
  const counts = basisCounts(s.assumptions);
  const edited = Object.values(s.assumptions).filter((a) => a.edited);
  const open = s.risks.filter((x) => x.open);
  return (
    <article className="memo" aria-hidden>
      <div className="memo-head">
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Bet memo · Category Bet Desk · {date}</div>
          <h1>{bet.name}</h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('/brand/fleek-logo.webp')} alt="Fleek logo" />
      </div>
      <p>
        <strong>Gate call: </strong>
        <span className="memo-verdict" style={{ background: VERDICT_BG[gate.verdict] }}>{gate.verdict}</span>{' '}
        {gate.reasons.join(' ')} {s.pilotLoaded && <em>Pilot readings are illustrative, not observed.</em>}
      </p>
      <h2>Thesis</h2>
      <div className="memo-cols" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div><strong>Who buys.</strong> {bet.thesis.whoBuys.map((p) => p.text).join(' ')}</div>
        <div><strong>Who supplies.</strong> {bet.thesis.whoSupplies.map((p) => p.text).join(' ')}</div>
        <div><strong>Why Fleek wins.</strong> {bet.thesis.whyFleekWins.map((p) => p.text).join(' ')}</div>
      </div>
      <div className="memo-cols">
        <div>
          <h2>Unit economics per bundle</h2>
          <table>
            <tbody>
              <tr><td>Bundle GMV ({v.piecesPerBundle} pcs, shipping inc.)</td><td className="r">{gbp(e.gmv)}</td></tr>
              <tr><td>Supplier payout (A/B/C {v.gradeA}/{v.gradeB}/{v.gradeC})</td><td className="r">{gbp(e.supplierCost)}</td></tr>
              <tr><td>Take revenue ({v.takeRate}%)</td><td className="r">{gbp(e.takeRevenue)}</td></tr>
              <tr><td>Shipping margin</td><td className="r">{gbp(e.freightMargin)}</td></tr>
              <tr><td>FleekSort grading</td><td className="r">{gbp(-e.gradingCost)}</td></tr>
              <tr><td>Payments + BNPL</td><td className="r">{gbp(-e.paymentCost)}</td></tr>
              <tr><td>Returns + dispute leakage</td><td className="r">{gbp(-e.disputeLeakage)}</td></tr>
              <tr className="total"><td>Contribution ({pct(e.contributionMarginPct)})</td><td className="r">{gbp(e.contribution)}</td></tr>
              <tr><td>After CAC · payback</td><td className="r">{gbp(e.contributionAfterCac)} · {e.paybackMonths === null ? 'never' : `${e.paybackMonths.toFixed(1)} mo`}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h2>Path to {gbpShort(v.targetAnnualGmv)} GMV</h2>
          <p>
            {r.monthReachingTarget ? <>Reaches the run-rate in <strong>month {r.monthReachingTarget}</strong>.</> : <strong>Does not reach the run-rate within 24 months.</strong>} Peak run-rate {gbpShort(r.peakRunRate)}; trailing 12-month GMV {gbpShort(r.trailing12Gmv)}.
          </p>
          <p className="tiny">
            {v.startSuppliers} suppliers +{v.suppliersAddedPerMonth}/mo (cap {v.maxSuppliers}) × {v.bundlesPerSupplierMonth} bundles × {v.sellThrough}% sell-through; {v.startBuyers} buyers +{v.newBuyersPerMonth}/mo at {v.buyerRetention}% retention × {v.bundlesPerBuyerMonth} bundles.
          </p>
          <h2>Stage-gate scorecard</h2>
          <table>
            <thead><tr><th>Metric</th><th className="r">Scale</th><th className="r">Kill</th><th className="r">Observed (n)</th><th>Status</th></tr></thead>
            <tbody>
              {s.metrics.map((m) => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td className="r">{m.direction === 'higher' ? '≥' : '≤'}{fmtMetric(m.scaleAt, m.unit)}</td>
                  <td className="r">{m.direction === 'higher' ? '<' : '>'}{fmtMetric(m.killAt, m.unit)}</td>
                  <td className="r">{m.observed === null ? '—' : `${fmtMetric(m.observed, m.unit)} (${m.sample ?? 0})`}</td>
                  <td>{gate.statuses[m.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <h2>Open risks and questions ({open.length})</h2>
      <ul>
        {open.slice(0, 6).map((x) => (
          <li key={x.id}><strong>[{x.severity}]</strong> {x.text} <em>Next: {x.nextStep || '—'}</em></li>
        ))}
      </ul>
      <h2>Evidence quality</h2>
      <p>
        {counts.sourced} sourced, {counts.estimated} estimated, {counts.placeholder} placeholder assumptions. {edited.length ? `Edited by the bet owner: ${edited.map((a) => a.label).join(', ')}.` : 'No assumptions edited from the preload.'} Placeholders must be replaced with measured values before a scale call is trusted.
      </p>
      <div className="memo-foot">
        Independent concept by Ayomide Ahmed. Not an official Fleek product and not affiliated with Fleek. Uses public information and clearly labelled estimates only; contains no Fleek internal data.
      </div>
    </article>
  );
}
