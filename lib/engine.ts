export type Basis = 'sourced' | 'estimated' | 'placeholder';

export interface SourceRef {
  label: string;
  url: string;
}

export type BundleKey =
  | 'piecesPerBundle'
  | 'gradeA'
  | 'gradeB'
  | 'gradeC'
  | 'supplierCostA'
  | 'supplierCostB'
  | 'supplierCostC'
  | 'gradingCostPerPiece'
  | 'takeRate'
  | 'shippingCharged'
  | 'kgPerPiece'
  | 'freightPerKg'
  | 'paymentCostPct'
  | 'disputeRate'
  | 'refundShare'
  | 'supplierRecovery'
  | 'buyerCac'
  | 'newBuyerShare'
  | 'bundlesPerBuyerYear';

export type RampKey =
  | 'startSuppliers'
  | 'suppliersAddedPerMonth'
  | 'maxSuppliers'
  | 'bundlesPerSupplierMonth'
  | 'sellThrough'
  | 'startBuyers'
  | 'newBuyersPerMonth'
  | 'buyerRetention'
  | 'bundlesPerBuyerMonth'
  | 'targetAnnualGmv';

export type AssumptionKey = BundleKey | RampKey;

export type Unit = 'pcs' | '%' | '£' | '£/pc' | '£/kg' | 'kg/pc' | 'count' | 'per month' | 'per year' | '£/yr';

export interface Assumption {
  key: AssumptionKey;
  label: string;
  value: number;
  unit: Unit;
  basis: Basis;
  source?: SourceRef;
  note: string;
  step?: number;
  /** Set once the bet owner overrides a preloaded value. */
  edited?: boolean;
}

export type Assumptions = Record<AssumptionKey, Assumption>;
export type Values = Record<AssumptionKey, number>;

export function valuesOf(a: Assumptions): Values {
  const out = {} as Values;
  for (const k of Object.keys(a) as AssumptionKey[]) out[k] = a[k].value;
  return out;
}

export interface InputIssue {
  key: AssumptionKey | 'gradeMix';
  message: string;
}

export function validate(v: Values): InputIssue[] {
  const issues: InputIssue[] = [];
  const mix = v.gradeA + v.gradeB + v.gradeC;
  if (Math.abs(mix - 100) > 0.01) issues.push({ key: 'gradeMix', message: `Grade mix sums to ${round(mix, 1)}%, not 100%.` });
  for (const k of ['gradeA', 'gradeB', 'gradeC', 'takeRate', 'paymentCostPct', 'disputeRate', 'refundShare', 'supplierRecovery', 'newBuyerShare', 'sellThrough', 'buyerRetention'] as const) {
    if (v[k] < 0 || v[k] > 100) issues.push({ key: k, message: `${k} must be between 0% and 100%.` });
  }
  if (v.takeRate >= 100) issues.push({ key: 'takeRate', message: 'Take rate must be below 100%.' });
  if (v.piecesPerBundle <= 0) issues.push({ key: 'piecesPerBundle', message: 'A bundle needs at least one piece.' });
  if (v.bundlesPerBuyerYear <= 0) issues.push({ key: 'bundlesPerBuyerYear', message: 'Bundles per buyer per year must be above zero.' });
  for (const k of Object.keys(v) as AssumptionKey[]) {
    if (!Number.isFinite(v[k])) issues.push({ key: k, message: `${k} is not a number.` });
    else if (v[k] < 0) issues.push({ key: k, message: `${k} cannot be negative.` });
  }
  return issues;
}

export interface BundleEconomics {
  supplierCostPerPiece: number;
  supplierCost: number;
  goodsGmv: number;
  takeRevenue: number;
  shippingCharged: number;
  gmv: number;
  buyerPricePerPiece: number;
  freightCost: number;
  freightMargin: number;
  gradingCost: number;
  paymentCost: number;
  disputeLeakage: number;
  contribution: number;
  contributionMarginPct: number;
  cacPerBundle: number;
  contributionAfterCac: number;
  /** Months for one acquired buyer's contribution to repay their CAC. null when contribution never repays it. */
  paybackMonths: number | null;
}

/**
 * Bundle P&L from the marketplace's side.
 * Supplier is paid their asking price; the commission comes out of what the buyer pays
 * for the goods, so goods GMV = supplier cost / (1 - take rate). Shipping is included
 * in the buyer's price and the marketplace pays the actual freight.
 */
export function bundleEconomics(v: Values): BundleEconomics {
  const n = v.piecesPerBundle;
  const take = v.takeRate / 100;
  const supplierCostPerPiece = (v.gradeA * v.supplierCostA + v.gradeB * v.supplierCostB + v.gradeC * v.supplierCostC) / 100;
  const supplierCost = n * supplierCostPerPiece;
  const goodsGmv = supplierCost / (1 - take);
  const takeRevenue = goodsGmv - supplierCost;
  const gmv = goodsGmv + v.shippingCharged;
  const freightCost = n * v.kgPerPiece * v.freightPerKg;
  const freightMargin = v.shippingCharged - freightCost;
  const gradingCost = n * v.gradingCostPerPiece;
  const paymentCost = gmv * (v.paymentCostPct / 100);
  const disputeLeakage = gmv * (v.disputeRate / 100) * (v.refundShare / 100) * (1 - v.supplierRecovery / 100);
  const contribution = takeRevenue + freightMargin - gradingCost - paymentCost - disputeLeakage;
  const cacPerBundle = ((v.newBuyerShare / 100) * v.buyerCac) / v.bundlesPerBuyerYear;
  const monthlyContributionPerBuyer = (contribution * v.bundlesPerBuyerYear) / 12;
  const paybackMonths = v.buyerCac === 0 ? 0 : monthlyContributionPerBuyer > 0 ? v.buyerCac / monthlyContributionPerBuyer : null;
  return {
    supplierCostPerPiece,
    supplierCost,
    goodsGmv,
    takeRevenue,
    shippingCharged: v.shippingCharged,
    gmv,
    buyerPricePerPiece: gmv / n,
    freightCost,
    freightMargin,
    gradingCost,
    paymentCost,
    disputeLeakage,
    contribution,
    contributionMarginPct: gmv > 0 ? (contribution / gmv) * 100 : 0,
    cacPerBundle,
    contributionAfterCac: contribution - cacPerBundle,
    paybackMonths,
  };
}

export interface RampMonth {
  month: number;
  suppliers: number;
  supplyBundles: number;
  activeBuyers: number;
  demandBundles: number;
  bundles: number;
  constraint: 'supply' | 'demand';
  gmv: number;
  annualRunRate: number;
  contribution: number;
  acquisitionSpend: number;
  cumulativeGmv: number;
}

export interface Ramp {
  months: RampMonth[];
  /** First month whose GMV x 12 reaches the target; null if not reached in the horizon. */
  monthReachingTarget: number | null;
  trailing12Gmv: number;
  peakRunRate: number;
}

export function ramp(v: Values, horizon = 24): Ramp {
  const econ = bundleEconomics(v);
  const months: RampMonth[] = [];
  let buyers = 0;
  let cumulativeGmv = 0;
  let monthReachingTarget: number | null = null;
  for (let m = 1; m <= horizon; m++) {
    const suppliers = Math.min(v.maxSuppliers, v.startSuppliers + v.suppliersAddedPerMonth * (m - 1));
    const supplyBundles = suppliers * v.bundlesPerSupplierMonth * (v.sellThrough / 100);
    const newBuyers = m === 1 ? v.startBuyers : v.newBuyersPerMonth;
    buyers = m === 1 ? v.startBuyers : buyers * (v.buyerRetention / 100) + v.newBuyersPerMonth;
    const demandBundles = buyers * v.bundlesPerBuyerMonth;
    const bundles = Math.min(supplyBundles, demandBundles);
    const gmv = bundles * econ.gmv;
    // Month-1 buyers are existing marketplace buyers crossing over; acquisition spend applies from month 2.
    const acquisitionSpend = m === 1 ? 0 : newBuyers * (v.newBuyerShare / 100) * v.buyerCac;
    cumulativeGmv += gmv;
    const row: RampMonth = {
      month: m,
      suppliers,
      supplyBundles,
      activeBuyers: buyers,
      demandBundles,
      bundles,
      constraint: supplyBundles < demandBundles ? 'supply' : 'demand',
      gmv,
      annualRunRate: gmv * 12,
      contribution: bundles * econ.contribution - acquisitionSpend,
      acquisitionSpend,
      cumulativeGmv,
    };
    if (monthReachingTarget === null && row.annualRunRate >= v.targetAnnualGmv) monthReachingTarget = m;
    months.push(row);
  }
  const last12 = months.slice(-12);
  return {
    months,
    monthReachingTarget,
    trailing12Gmv: last12.reduce((s, r) => s + r.gmv, 0),
    peakRunRate: Math.max(...months.map((r) => r.annualRunRate)),
  };
}

export interface OneWayRow {
  key: AssumptionKey;
  low: number;
  high: number;
  atLow: number;
  atHigh: number;
  swing: number;
}

/** Contribution per bundle when each assumption moves by +/- pct, sorted by swing. */
export function oneWaySensitivity(v: Values, keys: AssumptionKey[], pct = 20, metric: (v: Values) => number = (x) => bundleEconomics(x).contribution): OneWayRow[] {
  return keys
    .map((key) => {
      const low = v[key] * (1 - pct / 100);
      const high = v[key] * (1 + pct / 100);
      const atLow = metric({ ...v, [key]: low });
      const atHigh = metric({ ...v, [key]: high });
      return { key, low, high, atLow, atHigh, swing: Math.abs(atHigh - atLow) };
    })
    .sort((a, b) => b.swing - a.swing);
}

export interface Grid {
  xKey: AssumptionKey;
  yKey: AssumptionKey;
  xs: number[];
  ys: number[];
  cells: number[][];
}

export function twoWayGrid(v: Values, xKey: AssumptionKey, xs: number[], yKey: AssumptionKey, ys: number[], metric: (v: Values) => number): Grid {
  return { xKey, yKey, xs, ys, cells: ys.map((y) => xs.map((x) => metric({ ...v, [xKey]: x, [yKey]: y }))) };
}

/* ---------- Stage-gate scorecard ---------- */

export type MetricId = 'repeatBuyerRate' | 'disputeRate' | 'contributionPerBundle' | 'gradingAgreement';

export interface GateMetric {
  id: MetricId;
  label: string;
  definition: string;
  unit: '%' | '£';
  direction: 'higher' | 'lower';
  scaleAt: number;
  killAt: number;
  minSample: number;
  sampleUnit: string;
  observed: number | null;
  sample: number | null;
  thresholdBasis: Basis;
  thresholdNote: string;
  source?: SourceRef;
}

export type MetricStatus = 'scale' | 'hold' | 'kill' | 'insufficient' | 'no-data' | 'invalid';
export type Verdict = 'SCALE' | 'HOLD' | 'KILL' | 'INVALID';

export function thresholdsValid(m: GateMetric): boolean {
  return m.direction === 'higher' ? m.killAt < m.scaleAt : m.killAt > m.scaleAt;
}

export function metricStatus(m: GateMetric): MetricStatus {
  if (!thresholdsValid(m)) return 'invalid';
  if (m.observed === null || !Number.isFinite(m.observed)) return 'no-data';
  if (m.sample === null || m.sample < m.minSample) return 'insufficient';
  if (m.direction === 'higher') {
    if (m.observed >= m.scaleAt) return 'scale';
    if (m.observed < m.killAt) return 'kill';
    return 'hold';
  }
  if (m.observed <= m.scaleAt) return 'scale';
  if (m.observed > m.killAt) return 'kill';
  return 'hold';
}

export interface GateResult {
  verdict: Verdict;
  statuses: Record<MetricId, MetricStatus>;
  reasons: string[];
  measured: number;
  total: number;
}

/**
 * Kill if any metric with an adequate sample crosses its kill line.
 * Scale only if every metric clears its scale line on an adequate sample.
 * Anything else holds, with the gaps listed. Missing data never counts as a pass.
 */
export function evaluateGate(metrics: GateMetric[]): GateResult {
  const statuses = {} as Record<MetricId, MetricStatus>;
  const reasons: string[] = [];
  for (const m of metrics) statuses[m.id] = metricStatus(m);
  const invalid = metrics.filter((m) => statuses[m.id] === 'invalid');
  const measured = metrics.filter((m) => !['no-data', 'insufficient', 'invalid'].includes(statuses[m.id])).length;
  if (invalid.length) {
    for (const m of invalid) reasons.push(`${m.label}: kill line must sit on the wrong side of the scale line.`);
    return { verdict: 'INVALID', statuses, reasons, measured, total: metrics.length };
  }
  const kills = metrics.filter((m) => statuses[m.id] === 'kill');
  if (kills.length) {
    for (const m of kills) reasons.push(`${m.label} ${fmtMetric(m.observed!, m.unit)} crosses the kill line (${m.direction === 'higher' ? 'below' : 'above'} ${fmtMetric(m.killAt, m.unit)}) on n=${m.sample}.`);
    return { verdict: 'KILL', statuses, reasons, measured, total: metrics.length };
  }
  if (metrics.every((m) => statuses[m.id] === 'scale')) {
    reasons.push('Every metric clears its scale line on an adequate sample.');
    return { verdict: 'SCALE', statuses, reasons, measured, total: metrics.length };
  }
  for (const m of metrics) {
    const s = statuses[m.id];
    if (s === 'no-data') reasons.push(`${m.label}: not measured yet.`);
    else if (s === 'insufficient') reasons.push(`${m.label}: n=${m.sample} is below the minimum ${m.minSample} ${m.sampleUnit}.`);
    else if (s === 'hold') reasons.push(`${m.label} ${fmtMetric(m.observed!, m.unit)} sits between kill (${fmtMetric(m.killAt, m.unit)}) and scale (${fmtMetric(m.scaleAt, m.unit)}).`);
  }
  return { verdict: 'HOLD', statuses, reasons, measured, total: metrics.length };
}

export function fmtMetric(x: number, unit: '%' | '£'): string {
  return unit === '%' ? `${round(x, 1)}%` : `£${x.toFixed(2)}`;
}

export function round(x: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

export function basisCounts(a: Assumptions): Record<Basis, number> {
  const c: Record<Basis, number> = { sourced: 0, estimated: 0, placeholder: 0 };
  for (const k of Object.keys(a) as AssumptionKey[]) c[a[k].basis]++;
  return c;
}
