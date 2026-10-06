import type { Assumption, AssumptionKey, Assumptions, Basis, GateMetric, SourceRef } from './engine';
import { SOURCES } from './sources';

export interface ThesisPoint {
  text: string;
  basis: Basis;
  source?: SourceRef;
}

export interface ListingAnchor {
  /** Public per-piece listing prices observed on joinfleek.com (USD, shipping included). */
  minUsd: number;
  maxUsd: number;
  examples: string[];
  sources: SourceRef[];
}

export interface RiskItem {
  id: string;
  kind: 'risk' | 'question';
  text: string;
  nextStep: string;
  severity: 'high' | 'medium' | 'low';
  open: boolean;
}

export interface CategoryBet {
  id: 'sportswear-outdoor' | 'y2k-denim' | 'kidswear';
  name: string;
  shortName: string;
  tile: string;
  status: 'HYPOTHESIS';
  thesis: { whoBuys: ThesisPoint[]; whoSupplies: ThesisPoint[]; whyFleekWins: ThesisPoint[]; currentState: ThesisPoint };
  anchor: ListingAnchor;
  assumptions: Assumptions;
  metrics: GateMetric[];
  /** Synthetic pilot readings for demonstrating the scorecard. Never real Fleek data. */
  illustrativePilot: Record<GateMetric['id'], { observed: number; sample: number }>;
  risks: RiskItem[];
}

type Overrides = Partial<Record<AssumptionKey, Partial<Assumption>>>;

const est = (note: string): Pick<Assumption, 'basis' | 'note'> => ({ basis: 'estimated', note });
const ph = (note: string): Pick<Assumption, 'basis' | 'note'> => ({ basis: 'placeholder', note });

function base(): Assumptions {
  const a: Assumption[] = [
    { key: 'piecesPerBundle', label: 'Pieces per bundle', value: 10, unit: 'pcs', step: 1, basis: 'sourced', source: SOURCES.columbia, note: 'Public listings sell 10-piece bundles, e.g. "Columbia Fleece – Grade A/B – 10 Pcs" at $141 ($14.10/pc).' },
    { key: 'gradeA', label: 'Grade A share', value: 30, unit: '%', step: 1, ...ph('Grade mix of a typical bundle. Replace with FleekSort grade output from the first supplier samples.') },
    { key: 'gradeB', label: 'Grade B share', value: 50, unit: '%', step: 1, ...ph('As above.') },
    { key: 'gradeC', label: 'Grade C share', value: 20, unit: '%', step: 1, ...ph('As above.') },
    { key: 'supplierCostA', label: 'Supplier cost, grade A', value: 16, unit: '£/pc', step: 0.5, ...est('Back-solved so the implied buyer price sits inside the public listing range. Replace with quoted supplier prices.') },
    { key: 'supplierCostB', label: 'Supplier cost, grade B', value: 11, unit: '£/pc', step: 0.5, ...est('As above.') },
    { key: 'supplierCostC', label: 'Supplier cost, grade C', value: 6, unit: '£/pc', step: 0.5, ...est('As above.') },
    { key: 'gradingCostPerPiece', label: 'FleekSort grading cost', value: 0.1, unit: '£/pc', step: 0.01, ...ph('Compute plus grader review time per photographed piece. Not public.') },
    { key: 'takeRate', label: 'Take rate (commission)', value: 15, unit: '%', step: 0.5, ...ph('Commission is not public. TechCrunch reports Fleek takes a cut on the payment between buyer and supplier; the rate is not disclosed.') },
    { key: 'shippingCharged', label: 'Shipping built into buyer price', value: 25, unit: '£', step: 1, ...est('Listings say "Shipping Inc." The amount inside the price is not public.') },
    { key: 'kgPerPiece', label: 'Weight per piece', value: 0.7, unit: 'kg/pc', step: 0.05, ...est('Typical garment weight for the category.') },
    { key: 'freightPerKg', label: 'Freight + customs handling', value: 2.4, unit: '£/kg', step: 0.1, ...ph('Origin hub to buyer, incl. customs clearance. Replace with forwarder quotes per lane.') },
    { key: 'paymentCostPct', label: 'Payment + BNPL cost', value: 2.5, unit: '%', step: 0.1, ...est('Card processing plus funding the public "Buy Now, Pay Later" option (payment deferred up to 30 days after receipt).') },
    { key: 'disputeRate', label: 'Returns + dispute rate', value: 6, unit: '%', step: 0.5, ...ph('Share of bundles disputed under buyer protection. Not public.') },
    { key: 'refundShare', label: 'Average refund on a dispute', value: 40, unit: '%', step: 5, ...ph('Share of the bundle price refunded when a dispute is upheld.') },
    { key: 'supplierRecovery', label: 'Refund recovered from supplier', value: 50, unit: '%', step: 5, ...ph('Share of refunds charged back to the supplier.') },
    { key: 'buyerCac', label: 'Buyer CAC (new-to-Fleek buyers)', value: 60, unit: '£', step: 5, ...ph('Paid acquisition cost per new buyer. Not public.') },
    { key: 'newBuyerShare', label: 'Share of bet buyers new to Fleek', value: 25, unit: '%', step: 5, ...est('The job post says most bets sell to buyers already on Fleek, so most buyers carry no new CAC.') },
    { key: 'bundlesPerBuyerYear', label: 'Bundles per buyer, first 12 months', value: 8, unit: 'per year', step: 1, ...ph('Order frequency of a retained buyer.') },
    { key: 'startSuppliers', label: 'Suppliers live in month 1', value: 5, unit: 'count', step: 1, ...est('First supplier cohort from the "first suppliers" gate.') },
    { key: 'suppliersAddedPerMonth', label: 'Suppliers added per month', value: 3, unit: 'per month', step: 1, ...est('Onboarding pace for one bet owner using the existing outreach engine.') },
    { key: 'maxSuppliers', label: 'Supplier cap', value: 60, unit: 'count', step: 5, ...est('Practical limit of qualified suppliers for the category.') },
    { key: 'bundlesPerSupplierMonth', label: 'Bundles listed per supplier', value: 60, unit: 'per month', step: 5, ...est('Graded, listed bundles per active supplier.') },
    { key: 'sellThrough', label: 'Sell-through', value: 85, unit: '%', step: 1, ...est('Share of listed bundles that sell in the month.') },
    { key: 'startBuyers', label: 'Buyers active in month 1', value: 400, unit: 'count', step: 25, ...est('Existing buyers in adjacent categories who try the new supply.') },
    { key: 'newBuyersPerMonth', label: 'Buyers activated per month', value: 450, unit: 'per month', step: 25, ...est('Existing-buyer crossover plus new-to-Fleek buyers.') },
    { key: 'buyerRetention', label: 'Monthly buyer retention', value: 80, unit: '%', step: 1, ...est('Share of active buyers who stay active the next month.') },
    { key: 'bundlesPerBuyerMonth', label: 'Bundles per active buyer', value: 1.2, unit: 'per month', step: 0.1, ...est('Bundles per active buyer each month.') },
    { key: 'targetAnnualGmv', label: 'Target annual GMV run-rate', value: 5_000_000, unit: '£/yr', step: 250_000, basis: 'sourced', source: SOURCES.jobPost, note: 'Each bet "could add £5M+ in GMV".' },
  ];
  return Object.fromEntries(a.map((x) => [x.key, x])) as Assumptions;
}

function withOverrides(o: Overrides): Assumptions {
  const a = base();
  for (const k of Object.keys(o) as AssumptionKey[]) a[k] = { ...a[k], ...o[k] };
  return a;
}

function metrics(o: Partial<Record<GateMetric['id'], Partial<GateMetric>>> = {}): GateMetric[] {
  const m: GateMetric[] = [
    { id: 'repeatBuyerRate', label: 'Repeat-buyer rate (90 days)', definition: 'Buyers with a second order in the bet within 90 days of their first ÷ buyers whose first order is at least 90 days old.', unit: '%', direction: 'higher', scaleAt: 35, killAt: 20, minSample: 50, sampleUnit: 'buyers', observed: null, sample: null, thresholdBasis: 'placeholder', thresholdNote: 'Set before the pilot starts. Not benchmarked against Fleek data.' },
    { id: 'disputeRate', label: 'Dispute rate', definition: 'Bundles with a buyer-protection dispute ÷ bundles delivered.', unit: '%', direction: 'lower', scaleAt: 4, killAt: 8, minSample: 100, sampleUnit: 'bundles', observed: null, sample: null, thresholdBasis: 'placeholder', thresholdNote: 'Grade mismatch, dirty stock and non-delivery are recurring themes in public negative reviews (1,233 reviews, 4.4 score on 6 Oct 2026). That is review sentiment, not a dispute rate.', source: SOURCES.trustpilot },
    { id: 'contributionPerBundle', label: 'Contribution per bundle', definition: 'Take revenue + shipping margin − grading − payments − dispute leakage, per delivered bundle, before CAC.', unit: '£', direction: 'higher', scaleAt: 12, killAt: 3, minSample: 100, sampleUnit: 'bundles', observed: null, sample: null, thresholdBasis: 'placeholder', thresholdNote: 'Set before the pilot starts.' },
    { id: 'gradingAgreement', label: 'Grading agreement (FleekSort vs QC)', definition: 'Pieces where the FleekSort grade matches the hub QC grade ÷ pieces double-graded.', unit: '%', direction: 'higher', scaleAt: 85, killAt: 75, minSample: 200, sampleUnit: 'pieces', observed: null, sample: null, thresholdBasis: 'estimated', thresholdNote: 'Fleek publicly cites 82% accuracy for FleekSort overall. A new category should reach a higher agreement before buyers rely on the grades.', source: SOURCES.careers },
  ];
  return m.map((x) => ({ ...x, ...(o[x.id] ?? {}) }));
}

export const CATEGORIES: CategoryBet[] = [
  {
    id: 'sportswear-outdoor',
    name: 'Vintage sportswear & branded outdoor',
    shortName: 'Sportswear & outdoor',
    tile: '#f8c642',
    status: 'HYPOTHESIS',
    thesis: {
      currentState: { text: 'Fleek already lists this stock: Nike track pants, The North Face fleece and puffers, Columbia fleece and jackets. The bet is a dedicated £5M line with new supply behind it, not a category launch from zero.', basis: 'sourced', source: SOURCES.northFace },
      whoBuys: [
        { text: 'Online resellers on eBay, Vinted and Depop, plus vintage shops. The home page quotes buyers from these channels next to "45,000+ buyers source on Fleek".', basis: 'sourced', source: SOURCES.home },
        { text: 'Seasonal outerwear buyers who stock up before autumn and winter.', basis: 'estimated' },
      ],
      whoSupplies: [
        { text: 'Graders and rag houses, mostly in India, Pakistan and Dubai, where much of the world\u2019s secondhand clothing is sorted.', basis: 'sourced', source: SOURCES.fortune },
        { text: 'Branded outerwear surfacing from EU separate textile collection, which Fortune reports became mandatory last year.', basis: 'estimated', source: SOURCES.fortune },
      ],
      whyFleekWins: [
        { text: 'Demand already sits on Fleek, so this is a supply-first test rather than a two-sided cold start.', basis: 'sourced', source: SOURCES.jobPost },
        { text: 'Brand recognition and authenticity scoring from a photo matter most for branded goods, and FleekSort does both.', basis: 'sourced', source: SOURCES.careers },
        { text: 'Logos make the stock easy to search, so it should sell through faster than unbranded mixes.', basis: 'estimated' },
      ],
    },
    anchor: { minUsd: 14.1, maxUsd: 66.65, examples: ['Columbia Fleece, Grade A/B, 10 pcs: $14.10/pc', 'The North Face Fleece Jackets, 10 pcs: $21.98/pc', 'Nike track pants: $20.45-$22.71/pc', 'The North Face Puffer Jackets: $66.65/pc'], sources: [SOURCES.columbia, SOURCES.northFace, SOURCES.nikeTrack] },
    assumptions: withOverrides({}),
    metrics: metrics(),
    illustrativePilot: {
      repeatBuyerRate: { observed: 38, sample: 74 },
      disputeRate: { observed: 3.6, sample: 412 },
      contributionPerBundle: { observed: 13.4, sample: 412 },
      gradingAgreement: { observed: 87, sample: 640 },
    },
    risks: [
      { id: 's1', kind: 'risk', severity: 'high', text: 'Counterfeit branded outerwear reaches buyers and buyer protection absorbs the refunds.', nextStep: 'Double-grade every branded piece in the first 3 supplier lots; track authenticity flags separately from grade.', open: true },
      { id: 's2', kind: 'risk', severity: 'medium', text: 'Seasonality: puffer and fleece demand may collapse in spring, so a winter run-rate overstates the annual figure.', nextStep: 'Read run-rate on a trailing 12-month basis before any scale call.', open: true },
      { id: 's3', kind: 'question', severity: 'medium', text: 'Is heavy outerwear freight (per kg) covered by the shipping built into the price?', nextStep: 'Get forwarder quotes for the 3 main lanes; rerun the freight sensitivity.', open: true },
      { id: 's4', kind: 'question', severity: 'low', text: 'Which existing buyer segments already buy this stock, and how often?', nextStep: 'Ask the growth team for an anonymised cohort cut; never use individual buyer data in the desk.', open: true },
    ],
  },
  {
    id: 'y2k-denim',
    name: 'Y2K & 90s denim',
    shortName: 'Y2K & 90s denim',
    tile: '#0d2bff',
    status: 'HYPOTHESIS',
    thesis: {
      currentState: { text: 'Fleek already has a denim category and Y2K flare and bootcut collections. The bet is a deeper, graded denim supply line, not a new category on the site.', basis: 'sourced', source: SOURCES.y2kFlares },
      whoBuys: [
        { text: 'Depop and Vinted resellers buying trend-led women\u2019s denim (flares, bootcut, embroidered, low-rise).', basis: 'estimated', source: SOURCES.y2kFlares },
        { text: 'Vintage shops that need size-runs, not mixed bales. Fit and size data per piece decide whether a bundle sells.', basis: 'estimated' },
      ],
      whoSupplies: [
        { text: 'Graders in India and Pakistan, and EU sorting centres with large denim volumes.', basis: 'sourced', source: SOURCES.fortune },
        { text: 'Upcycling workshops turning C-grade denim into skirts, vests and patchwork. Upcycled denim is already listed on Fleek.', basis: 'sourced', source: SOURCES.denim },
      ],
      whyFleekWins: [
        { text: 'FleekSort\u2019s public example is denim: it reads "bootcut silhouette, mid-rise", waist size and fabric from a photo.', basis: 'sourced', source: SOURCES.careers },
        { text: 'Size and fit attributes turn a blind bale into a searchable listing, which suits denim buyers who sort by size.', basis: 'estimated' },
      ],
    },
    anchor: { minUsd: 11.08, maxUsd: 39.48, examples: ['Y2K Flare Jeans, AB grade: $17.52/pc', 'Y2K Embroidery Bootcut Jeans, AB grade: $15.04-$18.41/pc', 'Y2K Denim Shorts & Skirts: $11.08/pc', 'Denim jackets: $39.48/pc'], sources: [SOURCES.y2kFlares, SOURCES.denim] },
    assumptions: withOverrides({
      gradeA: { value: 25 },
      gradeB: { value: 55 },
      gradeC: { value: 20 },
      supplierCostA: { value: 14 },
      supplierCostB: { value: 10 },
      supplierCostC: { value: 5 },
      shippingCharged: { value: 22 },
      kgPerPiece: { value: 0.6 },
      disputeRate: { value: 7 },
      newBuyersPerMonth: { value: 650 },
      bundlesPerSupplierMonth: { value: 75 },
    }),
    metrics: metrics(),
    illustrativePilot: {
      repeatBuyerRate: { observed: 41, sample: 31 },
      disputeRate: { observed: 5.2, sample: 268 },
      contributionPerBundle: { observed: 12.8, sample: 268 },
      gradingAgreement: { observed: 79, sample: 520 },
    },
    risks: [
      { id: 'd1', kind: 'risk', severity: 'high', text: 'Holes, stains and fading that a photo misses drive grade-mismatch disputes. Holes in jeans appear in public reviews.', nextStep: 'Add a defect checklist to QC for denim; compare FleekSort vs QC on 500 pieces before scaling.', open: true },
      { id: 'd2', kind: 'risk', severity: 'medium', text: 'Trend risk: flares and bootcut demand may turn faster than supplier stock.', nextStep: 'Keep a style mix target; review sell-through by silhouette every month.', open: true },
      { id: 'd3', kind: 'question', severity: 'medium', text: 'Will buyers pay more for size-run bundles than for mixed bundles?', nextStep: 'Run a priced A/B on 20 size-run vs 20 mixed bundles from the same supplier.', open: true },
      { id: 'd4', kind: 'question', severity: 'low', text: 'Is upcycling C-grade into new product worth a separate supplier track?', nextStep: 'Size the C-grade share from the first 3 supplier samples.', open: true },
    ],
  },
  {
    id: 'kidswear',
    name: 'Kidswear',
    shortName: 'Kidswear',
    tile: '#f86868',
    status: 'HYPOTHESIS',
    thesis: {
      currentState: { text: 'Fleek already has a kidswear category with branded bundles (OshKosh overalls, Polo Ralph Lauren kids). The bet is scaling branded and everyday kidswear to its own £5M line.', basis: 'sourced', source: SOURCES.kidswear },
      whoBuys: [
        { text: 'Resellers and shops selling to parents. Kids outgrow clothes fast, so buyers restock often.', basis: 'estimated' },
        { text: 'Retail buyers that want bulk branded kidswear at a low price per piece.', basis: 'estimated', source: SOURCES.kidswear },
      ],
      whoSupplies: [
        { text: 'The same graders and rag houses that sort adult clothing. Kidswear comes out of the same donated textile streams.', basis: 'estimated', source: SOURCES.fortune },
      ],
      whyFleekWins: [
        { text: 'Demand already sits on Fleek and the category is already listed, so the supply-first test is quick to read.', basis: 'sourced', source: SOURCES.jobPost },
        { text: 'Grading and sizing by photo saves hand-sorting on many small, low-value pieces.', basis: 'estimated' },
      ],
    },
    anchor: { minUsd: 6.53, maxUsd: 14.45, examples: ['Polo Ralph Lauren Kidswear mix: $6.53/pc', 'OshKosh Kids Overalls bundles: $10.29-$14.45/pc', 'Mixed Branded Kidswear bundle: $11.82/pc'], sources: [SOURCES.kidswear] },
    assumptions: withOverrides({
      piecesPerBundle: { value: 15, basis: 'estimated', source: SOURCES.kidswear, note: 'Public kidswear bundles work out at roughly 12-20 pieces (bundle price ÷ price per piece).' },
      supplierCostA: { value: 8 },
      supplierCostB: { value: 5.5 },
      supplierCostC: { value: 3 },
      shippingCharged: { value: 20 },
      kgPerPiece: { value: 0.3 },
      gradingCostPerPiece: { value: 0.1 },
      bundlesPerSupplierMonth: { value: 80 },
      newBuyersPerMonth: { value: 520 },
    }),
    metrics: metrics({ contributionPerBundle: { scaleAt: 9, killAt: 2 } }),
    illustrativePilot: {
      repeatBuyerRate: { observed: 33, sample: 66 },
      disputeRate: { observed: 9.4, sample: 305 },
      contributionPerBundle: { observed: 4.1, sample: 305 },
      gradingAgreement: { observed: 83, sample: 450 },
    },
    risks: [
      { id: 'k1', kind: 'risk', severity: 'high', text: 'Product safety rules for children\u2019s clothing (drawstrings, small parts, flammability) apply to resale in the UK, EU and US.', nextStep: 'Get a regulatory check per destination market before scaling; add a safety exclusion list to grading.', open: true },
      { id: 'k2', kind: 'risk', severity: 'high', text: 'Low price per piece: fixed costs per bundle (grading, freight, disputes) take a larger share of GMV.', nextStep: 'Watch contribution per bundle in the sensitivity table; test 20+ piece bundles.', open: true },
      { id: 'k3', kind: 'question', severity: 'medium', text: 'Do kidswear buyers need exact age/size breakdowns before they buy?', nextStep: 'Add age bands to the FleekSort output on a test lot and compare conversion.', open: true },
    ],
  },
];

export function getCategory(id: string): CategoryBet {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
