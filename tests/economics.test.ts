import { describe, expect, it } from 'vitest';
import { bundleEconomics, evaluateGate, oneWaySensitivity, ramp, twoWayGrid, validate, valuesOf, type GateMetric, type Values } from '@/lib/model';
import { CATEGORIES } from '@/lib/categories';
import { initialState, reducer } from '@/lib/state';

/** Hand-calculated reference bundle. Every expected figure below was worked out on paper first. */
const HAND: Values = {
  ...valuesOf(CATEGORIES[0].assumptions),
  piecesPerBundle: 10,
  gradeA: 30, gradeB: 50, gradeC: 20,
  supplierCostA: 18, supplierCostB: 12, supplierCostC: 6,
  takeRate: 20,
  shippingCharged: 20,
  kgPerPiece: 0.6, freightPerKg: 2.5,
  gradingCostPerPiece: 0.15,
  paymentCostPct: 2,
  disputeRate: 5, refundShare: 50, supplierRecovery: 40,
  buyerCac: 60, newBuyerShare: 25, bundlesPerBuyerYear: 6,
};

describe('bundle economics vs hand calculation', () => {
  const e = bundleEconomics(HAND);
  it('weights supplier cost by grade mix: 0.3×18 + 0.5×12 + 0.2×6 = £12.60/pc, £126 per bundle', () => {
    expect(e.supplierCostPerPiece).toBeCloseTo(12.6, 10);
    expect(e.supplierCost).toBeCloseTo(126, 10);
  });
  it('grosses up for commission: 126 / 0.8 = £157.50 goods GMV, £31.50 take', () => {
    expect(e.goodsGmv).toBeCloseTo(157.5, 10);
    expect(e.takeRevenue).toBeCloseTo(31.5, 10);
  });
  it('adds included shipping: GMV £177.50, £17.75/pc', () => {
    expect(e.gmv).toBeCloseTo(177.5, 10);
    expect(e.buyerPricePerPiece).toBeCloseTo(17.75, 10);
  });
  it('freight 10 × 0.6 kg × £2.50 = £15, shipping margin £5', () => {
    expect(e.freightCost).toBeCloseTo(15, 10);
    expect(e.freightMargin).toBeCloseTo(5, 10);
  });
  it('grading £1.50, payments 2% of 177.50 = £3.55', () => {
    expect(e.gradingCost).toBeCloseTo(1.5, 10);
    expect(e.paymentCost).toBeCloseTo(3.55, 10);
  });
  it('dispute leakage 177.50 × 5% × 50% × (1 − 40%) = £2.6625', () => {
    expect(e.disputeLeakage).toBeCloseTo(2.6625, 10);
  });
  it('contribution 31.50 + 5 − 1.50 − 3.55 − 2.6625 = £28.7875 (16.22% of GMV)', () => {
    expect(e.contribution).toBeCloseTo(28.7875, 10);
    expect(e.contributionMarginPct).toBeCloseTo((28.7875 / 177.5) * 100, 10);
  });
  it('CAC per bundle 25% × £60 / 6 = £2.50; after CAC £26.2875', () => {
    expect(e.cacPerBundle).toBeCloseTo(2.5, 10);
    expect(e.contributionAfterCac).toBeCloseTo(26.2875, 10);
  });
  it('payback £60 / (28.7875 × 6 / 12) = 4.168 months', () => {
    expect(e.paybackMonths).toBeCloseTo(60 / 14.39375, 10);
  });
  it('payback is null (never) when contribution is not positive', () => {
    expect(bundleEconomics({ ...HAND, takeRate: 0, shippingCharged: 0 }).paybackMonths).toBeNull();
  });
});

describe('validation refuses broken inputs', () => {
  it('rejects a grade mix that does not sum to 100%', () => {
    expect(validate({ ...HAND, gradeC: 30 }).map((i) => i.key)).toContain('gradeMix');
  });
  it('rejects a take rate of 100%', () => {
    expect(validate({ ...HAND, takeRate: 100 }).map((i) => i.key)).toContain('takeRate');
  });
  it('accepts every preloaded category', () => {
    for (const c of CATEGORIES) expect(validate(valuesOf(c.assumptions))).toEqual([]);
  });
});

describe('ramp vs hand calculation', () => {
  const v: Values = { ...HAND, startSuppliers: 2, suppliersAddedPerMonth: 1, maxSuppliers: 3, bundlesPerSupplierMonth: 100, sellThrough: 50, startBuyers: 100, newBuyersPerMonth: 50, buyerRetention: 80, bundlesPerBuyerMonth: 1, targetAnnualGmv: 300_000 };
  const r = ramp(v, 4);
  it('month 1: supply 2×100×50% = 100, demand 100 buyers × 1 = 100, GMV 100 × 177.50', () => {
    expect(r.months[0].supplyBundles).toBe(100);
    expect(r.months[0].demandBundles).toBe(100);
    expect(r.months[0].gmv).toBeCloseTo(17_750, 6);
    expect(r.months[0].acquisitionSpend).toBe(0);
  });
  it('month 2: buyers 100×0.8 + 50 = 130, supply 150, demand-bound at 130 bundles', () => {
    expect(r.months[1].activeBuyers).toBeCloseTo(130, 10);
    expect(r.months[1].bundles).toBeCloseTo(130, 10);
    expect(r.months[1].constraint).toBe('demand');
    expect(r.months[1].acquisitionSpend).toBeCloseTo(50 * 0.25 * 60, 10);
  });
  it('month 3: supplier cap 3 → supply 150; buyers 154 → supply-bound', () => {
    expect(r.months[2].suppliers).toBe(3);
    expect(r.months[2].activeBuyers).toBeCloseTo(154, 10);
    expect(r.months[2].bundles).toBe(150);
    expect(r.months[2].constraint).toBe('supply');
  });
  it('first month with GMV × 12 ≥ £300k is month 3 (150 × 177.50 × 12 = £319,500)', () => {
    expect(r.months[1].annualRunRate).toBeCloseTo(276_900, 6);
    expect(r.monthReachingTarget).toBe(3);
  });
  it('reports null when the target is never reached', () => {
    expect(ramp({ ...v, targetAnnualGmv: 1e9 }, 4).monthReachingTarget).toBeNull();
  });
});

describe('sensitivity', () => {
  it('one-way: take rate swing equals contribution difference at ±20%', () => {
    const rows = oneWaySensitivity(HAND, ['takeRate', 'disputeRate']);
    const take = rows.find((r) => r.key === 'takeRate')!;
    expect(take.atHigh - take.atLow).toBeCloseTo(bundleEconomics({ ...HAND, takeRate: 24 }).contribution - bundleEconomics({ ...HAND, takeRate: 16 }).contribution, 10);
    expect(rows[0].swing).toBeGreaterThanOrEqual(rows[1].swing);
  });
  it('two-way grid cell matches a direct recalculation', () => {
    const g = twoWayGrid(HAND, 'takeRate', [10, 20], 'disputeRate', [5, 10], (x) => bundleEconomics(x).contribution);
    expect(g.cells[0][1]).toBeCloseTo(28.7875, 10);
    expect(g.cells[1][0]).toBeCloseTo(bundleEconomics({ ...HAND, takeRate: 10, disputeRate: 10 }).contribution, 10);
  });
});

describe('stage-gate scorecard', () => {
  const m = (o: Partial<GateMetric>): GateMetric => ({ ...CATEGORIES[0].metrics[0], ...o });
  const all = (o: Partial<GateMetric>[]) => CATEGORIES[0].metrics.map((x, i) => ({ ...x, ...o[i] }));
  it('missing data never counts as a pass', () => {
    expect(evaluateGate(CATEGORIES[0].metrics).verdict).toBe('HOLD');
  });
  it('a sample below the minimum is insufficient even if the reading looks great', () => {
    const r = evaluateGate(all([{ observed: 90, sample: 10 }, { observed: 1, sample: 500 }, { observed: 30, sample: 500 }, { observed: 95, sample: 900 }]));
    expect(r.verdict).toBe('HOLD');
    expect(r.statuses.repeatBuyerRate).toBe('insufficient');
  });
  it('one kill on an adequate sample kills the bet', () => {
    const r = evaluateGate(all([{ observed: 50, sample: 80 }, { observed: 9, sample: 200 }, { observed: 20, sample: 200 }, { observed: 90, sample: 300 }]));
    expect(r.verdict).toBe('KILL');
  });
  it('lower-is-better metrics use the right direction', () => {
    expect(evaluateGate([m({ id: 'disputeRate', direction: 'lower', scaleAt: 4, killAt: 8, observed: 4, sample: 500, minSample: 100 })]).verdict).toBe('SCALE');
    expect(evaluateGate([m({ id: 'disputeRate', direction: 'lower', scaleAt: 4, killAt: 8, observed: 8.1, sample: 500, minSample: 100 })]).verdict).toBe('KILL');
  });
  it('refuses thresholds where the kill line is on the scale side', () => {
    expect(evaluateGate([m({ scaleAt: 20, killAt: 35 })]).verdict).toBe('INVALID');
  });
  it('removing evidence never moves a bet to SCALE', () => {
    const full = all([{ observed: 38, sample: 74 }, { observed: 3.6, sample: 412 }, { observed: 13.4, sample: 412 }, { observed: 87, sample: 640 }]);
    expect(evaluateGate(full).verdict).toBe('SCALE');
    for (let i = 0; i < full.length; i++) {
      const fewer = full.map((x, j) => (j === i ? { ...x, observed: null, sample: null } : x));
      expect(evaluateGate(fewer).verdict).toBe('HOLD');
    }
  });
  it('the three preloaded illustrative pilots give SCALE, HOLD and KILL', () => {
    const verdicts = CATEGORIES.map((c) => evaluateGate(c.metrics.map((x) => ({ ...x, ...c.illustrativePilot[x.id] }))).verdict);
    expect(verdicts).toEqual(['SCALE', 'HOLD', 'KILL']);
  });
});

describe('assumption labels', () => {
  it('every assumption is labelled, and every sourced one links to a source', () => {
    for (const c of CATEGORIES) {
      for (const a of Object.values(c.assumptions)) {
        expect(['sourced', 'estimated', 'placeholder']).toContain(a.basis);
        if (a.basis === 'sourced') expect(a.source?.url).toMatch(/^https:\/\//);
      }
    }
  });
  it('editing a sourced value relabels it as estimated; restoring it restores the label', () => {
    const bet = CATEGORIES[0];
    const r = reducer(bet);
    const edited = r(initialState(bet), { type: 'setAssumption', key: 'piecesPerBundle', value: 12 });
    expect(edited.assumptions.piecesPerBundle.basis).toBe('estimated');
    expect(edited.assumptions.piecesPerBundle.edited).toBe(true);
    const restored = r(edited, { type: 'setAssumption', key: 'piecesPerBundle', value: 10 });
    expect(restored.assumptions.piecesPerBundle.basis).toBe('sourced');
  });
});
