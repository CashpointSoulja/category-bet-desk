# Test plan and results

## What is tested

| Area | How | Pass criteria |
|---|---|---|
| Bundle economics | Unit tests in [`tests/economics.test.ts`](../tests/economics.test.ts) against a hand-worked bundle (below) | Every line of the P&L matches the hand figure to 10 decimal places |
| Ramp | Unit tests against a hand-worked 4-month ramp | Suppliers, buyers, bundles, binding constraint and target month match |
| Sensitivity | Unit tests: one-way swing and a two-way cell recalculated directly | Equal to direct recalculation |
| Gate logic | Unit tests: missing data, thin sample, kill, direction, invalid thresholds, evidence removal | Missing or thin evidence never scales; one kill kills; invalid thresholds refused |
| Labels | Unit tests: every assumption labelled; every sourced one has a URL; editing a sourced value relabels it | All pass |
| Type safety and build | `npm run typecheck`, `npm run build:pages` | No errors; static export |
| Browser behaviour | Scripted Chromium run against the production build served under `/category-bet-desk/`, at 1366 px and 390 px | All checks PASS, no console errors, no failed requests |
| Memo | Print-media PDF of the memo | Exactly one A4 page |
| Visual | Screenshots at 1366 px and 390 px reviewed by eye ([screens](screens/)) | Logo visible top-left, no clipping or horizontal scroll |

## Hand-calculated reference bundle

Inputs: 10 pieces; grade mix 30/50/20; supplier cost £18/£12/£6 per piece; take rate 20%; shipping in price £20; 0.6 kg/pc at £2.50/kg; grading £0.15/pc; payments 2%; disputes 5% with 50% refunded and 40% recovered from the supplier; CAC £60, 25% of buyers new, 6 bundles per buyer per year.

| Line | Working | Result |
|---|---|---|
| Supplier cost / pc | 0.3×18 + 0.5×12 + 0.2×6 | £12.60 |
| Supplier payout | 10 × 12.60 | £126.00 |
| Goods price | 126 ÷ (1 − 0.20) | £157.50 |
| Take revenue | 157.50 − 126 | £31.50 |
| Bundle GMV | 157.50 + 20 | £177.50 (£17.75/pc) |
| Freight | 10 × 0.6 × 2.50 | £15.00 → shipping margin £5.00 |
| Grading | 10 × 0.15 | £1.50 |
| Payments | 2% × 177.50 | £3.55 |
| Dispute leakage | 177.50 × 5% × 50% × 60% | £2.6625 |
| Contribution | 31.50 + 5 − 1.50 − 3.55 − 2.6625 | **£28.7875** (16.22%) |
| CAC per bundle | 25% × 60 ÷ 6 | £2.50 → after CAC £26.2875 |
| Payback | 60 ÷ (28.7875 × 6 ÷ 12) | 4.17 months |

Hand-worked ramp: 2 suppliers +1/month capped at 3, 100 bundles each at 50% sell-through; 100 buyers, +50/month, 80% retention, 1 bundle each; target £300k run-rate. Month 1: 100 supply, 100 demand, GMV £17,750. Month 2: 130 buyers, 150 supply → 130 bundles (demand-bound), run-rate £276,900. Month 3: cap 3 suppliers → 150 supply, 154 buyers → 150 bundles (supply-bound), run-rate £319,500 → target reached in month 3.

## Results

Recorded on 6 October 2026 on Node 22, from my own runs. Output below is copied from the terminal.

### Unit tests, typecheck and build

```text
$ npm run typecheck
> category-bet-desk@0.1.0 typecheck
> tsc --noEmit

$ npm test
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > weights supplier cost by grade mix: 0.3×18 + 0.5×12 + 0.2×6 = £12.60/pc, £126 per bundle
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > grosses up for commission: 126 / 0.8 = £157.50 goods GMV, £31.50 take
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > adds included shipping: GMV £177.50, £17.75/pc
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > freight 10 × 0.6 kg × £2.50 = £15, shipping margin £5
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > grading £1.50, payments 2% of 177.50 = £3.55
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > dispute leakage 177.50 × 5% × 50% × (1 − 40%) = £2.6625
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > contribution 31.50 + 5 − 1.50 − 3.55 − 2.6625 = £28.7875 (16.22% of GMV)
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > CAC per bundle 25% × £60 / 6 = £2.50; after CAC £26.2875
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > payback £60 / (28.7875 × 6 / 12) = 4.168 months
 ✓ tests/economics.test.ts > bundle economics vs hand calculation > payback is null (never) when contribution is not positive
 ✓ tests/economics.test.ts > validation refuses broken inputs > rejects a grade mix that does not sum to 100%
 ✓ tests/economics.test.ts > validation refuses broken inputs > rejects a take rate of 100%
 ✓ tests/economics.test.ts > validation refuses broken inputs > accepts every preloaded category
 ✓ tests/economics.test.ts > ramp vs hand calculation > month 1: supply 2×100×50% = 100, demand 100 buyers × 1 = 100, GMV 100 × 177.50
 ✓ tests/economics.test.ts > ramp vs hand calculation > month 2: buyers 100×0.8 + 50 = 130, supply 150, demand-bound at 130 bundles
 ✓ tests/economics.test.ts > ramp vs hand calculation > month 3: supplier cap 3 → supply 150; buyers 154 → supply-bound
 ✓ tests/economics.test.ts > ramp vs hand calculation > first month with GMV × 12 ≥ £300k is month 3 (150 × 177.50 × 12 = £319,500)
 ✓ tests/economics.test.ts > ramp vs hand calculation > reports null when the target is never reached
 ✓ tests/economics.test.ts > sensitivity > one-way: take rate swing equals contribution difference at ±20%
 ✓ tests/economics.test.ts > sensitivity > two-way grid cell matches a direct recalculation
 ✓ tests/economics.test.ts > stage-gate scorecard > missing data never counts as a pass
 ✓ tests/economics.test.ts > stage-gate scorecard > a sample below the minimum is insufficient even if the reading looks great
 ✓ tests/economics.test.ts > stage-gate scorecard > one kill on an adequate sample kills the bet
 ✓ tests/economics.test.ts > stage-gate scorecard > lower-is-better metrics use the right direction
 ✓ tests/economics.test.ts > stage-gate scorecard > refuses thresholds where the kill line is on the scale side
 ✓ tests/economics.test.ts > stage-gate scorecard > removing evidence never moves a bet to SCALE
 ✓ tests/economics.test.ts > stage-gate scorecard > the three preloaded illustrative pilots give SCALE, HOLD and KILL
 ✓ tests/economics.test.ts > assumption labels > every assumption is labelled, and every sourced one links to a source
 ✓ tests/economics.test.ts > assumption labels > editing a sourced value relabels it as estimated; restoring it restores the label
 Test Files  1 passed (1)
      Tests  29 passed (29)
$ npm run build:pages

Route (app)                              Size     First Load JS
┌ ○ /                                    17.7 kB         105 kB
└ ○ /_not-found                          873 B          88.3 kB
+ First Load JS shared by all            87.4 kB
  ├ chunks/117-d21204d57a066d15.js       31.9 kB
  ├ chunks/fd9d1056-1193015d97216f31.js  53.6 kB
  └ other shared chunks (total)          1.87 kB


○  (Static)  prerendered as static content

```

### Browser checks (production build, Chromium)

```text
PASS desktop: logo loads, leftmost in header, top of page — {"ok":true,"x":87,"y":52,"contentLeft":87,"leftmost":true}
PASS desktop: footer text
PASS desktop: no horizontal overflow
PASS sportswear contribution £21.56 — £21.56
PASS sportswear hits £5M in month 17
PASS take rate 12% updates contribution — £17.12
PASS edited row flagged
PASS bad grade mix is refused
PASS export disabled while invalid
PASS edited sourced value relabelled estimated
PASS edits persist after reload
PASS reset restores preload
PASS kidswear not reached in 24 mo
PASS kidswear pilot gate KILL
PASS denim pilot gate HOLD
PASS kill line on scale side refused
PASS risk added
PASS two-way grid switches
PASS mobile: logo loads, leftmost in header, top of page — {"ok":true,"x":16,"y":89,"contentLeft":16,"leftmost":true}
PASS mobile: footer text
PASS mobile: no horizontal overflow
PASS no console/page errors
PASS no failed requests
memo pdf pages: 1
```

Sample memo output: [bet-memo-sample.pdf](screens/bet-memo-sample.pdf).

## Not tested

- Safari and Firefox print layout (Chromium only).
- Screen readers beyond labelled inputs and status regions.
- Real Fleek data: none exists in this concept.
