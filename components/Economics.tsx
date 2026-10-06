'use client';
import type { BundleEconomics, Values } from '@/lib/model';
import type { ListingAnchor } from '@/lib/categories';
import { USD_TO_GBP, USD_TO_GBP_NOTE } from '@/lib/sources';
import { gbp, pct } from '@/lib/format';
import { BasisChip } from './Basis';

export function EconomicsKpis({ e }: { e: BundleEconomics }) {
  return (
    <div className="kpis">
      <Kpi label="Buyer price" value={gbp(e.gmv)} sub={`${gbp(e.buyerPricePerPiece)}/pc · Shipping Inc.`} />
      <Kpi label="Contribution / bundle" value={gbp(e.contribution)} sub={`${pct(e.contributionMarginPct)} of GMV, before CAC`} tone={e.contribution > 0 ? 'pos' : 'neg'} />
      <Kpi label="After CAC / bundle" value={gbp(e.contributionAfterCac)} sub={`CAC load ${gbp(e.cacPerBundle)} per bundle`} tone={e.contributionAfterCac > 0 ? 'pos' : 'neg'} />
      <Kpi label="CAC payback" value={e.paybackMonths === null ? 'Never' : `${e.paybackMonths.toFixed(1)} mo`} sub="per new-to-Fleek buyer" tone={e.paybackMonths === null ? 'neg' : undefined} />
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${tone ?? ''}`}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export function Waterfall({ e, v }: { e: BundleEconomics; v: Values }) {
  const rows: [string, number, string, ('sub' | 'total')?][] = [
    ['Supplier payout (grade-weighted)', e.supplierCost, `${v.piecesPerBundle} pcs × ${gbp(e.supplierCostPerPiece)}`, 'sub'],
    ['Goods price to buyer', e.goodsGmv, `payout ÷ (1 − ${v.takeRate}% take)`, 'sub'],
    ['Shipping built into price', e.shippingCharged, 'Shipping Inc.', 'sub'],
    ['Bundle GMV', e.gmv, 'what the buyer pays', 'sub'],
    ['Take revenue', e.takeRevenue, `${v.takeRate}% of goods price`],
    ['Shipping margin', e.freightMargin, `${gbp(e.shippingCharged)} charged − ${gbp(e.freightCost)} freight`],
    ['FleekSort grading', -e.gradingCost, `${v.piecesPerBundle} × ${gbp(v.gradingCostPerPiece)}`],
    ['Payments + BNPL', -e.paymentCost, `${v.paymentCostPct}% of GMV`],
    ['Returns + dispute leakage', -e.disputeLeakage, `${v.disputeRate}% × ${v.refundShare}% refund × ${100 - v.supplierRecovery}% unrecovered`],
    ['Contribution per bundle', e.contribution, 'before CAC', 'total'],
    ['Buyer CAC per bundle', -e.cacPerBundle, `${v.newBuyerShare}% new × ${gbp(v.buyerCac, 0)} ÷ ${v.bundlesPerBuyerYear} bundles`],
    ['Contribution after CAC', e.contributionAfterCac, '', 'total'],
  ];
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Unit economics per bundle</caption>
        <thead>
          <tr>
            <th>Per bundle</th>
            <th className="r">£</th>
            <th>How</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, val, how, kind]) => (
            <tr key={label} className={kind}>
              <td>{label}</td>
              <td className={`r ${kind !== 'sub' && val < 0 ? 'neg' : ''}`}>{gbp(val)}</td>
              <td className="small muted">{how}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnchorCheck({ e, anchor }: { e: BundleEconomics; anchor: ListingAnchor }) {
  const ppcUsd = e.buyerPricePerPiece / USD_TO_GBP;
  const inside = ppcUsd >= anchor.minUsd && ppcUsd <= anchor.maxUsd;
  return (
    <div className={`anchor-check ${inside ? 'anchor-in' : 'anchor-out'}`}>
      <strong>Price check against public listings.</strong> Modelled buyer price {gbp(e.buyerPricePerPiece)}/pc ≈ ${ppcUsd.toFixed(2)}/pc{' '}
      {inside ? 'sits inside' : 'sits outside'} the ${anchor.minUsd.toFixed(2)}–${anchor.maxUsd.toFixed(2)}/pc range seen on joinfleek.com.{' '}
      {anchor.sources.map((s) => (
        <BasisChip key={s.url} basis="sourced" source={s} />
      ))}
      <div className="tiny muted" style={{ marginTop: 6 }}>
        Examples: {anchor.examples.join('; ')}. Conversion at {USD_TO_GBP} £/$ <BasisChip basis="estimated" />: {USD_TO_GBP_NOTE}
      </div>
    </div>
  );
}
