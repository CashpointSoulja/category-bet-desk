# PRD: Category Bet Desk

Independent concept by Ayomide Ahmed. Not an official Fleek product.

## Problem

Fleek's Special Projects Lead, Category Expansion takes "new category bets from thesis to proven economics"; each "could add £5M+ in GMV". The [job post](https://www.ycombinator.com/companies/fleek/jobs/Iopbt9d-special-projects-lead-category-expansion) describes the loop: write the thesis, sign the first suppliers, get first GMV, then make a feasible-or-not call, with win and kill metrics set at the start.

The inputs to that call live in different places: supplier quotes, grading samples, freight quotes, pilot orders, and a spreadsheet model. When they are apart, three things go wrong:

1. The P&L per bundle and the path to £5M are argued separately, so a bet can look good on margin and still never reach scale (or the other way round).
2. Kill thresholds get set after the data comes in, which makes them easy to move.
3. Nobody can tell which numbers are measured and which are guesses.

These are risks I expect in any new-category process, inferred from the job post. They are not observed Fleek problems.

## User

One seat: the Special Projects Lead, Category Expansion (the bet owner). Secondary readers: the founders and the growth, supply and operations leads who sign off on a scale call.

## Goal

For one bet, show the thesis, the bundle economics, the ramp to £5M and the gate call in one place, with the evidence quality of every number visible, and produce a one-page memo for the decision meeting.

## Scope (v1)

| # | Requirement | Built |
|---|---|---|
| R1 | Pick from three preloaded bets: vintage sportswear & branded outdoor, Y2K & 90s denim, kidswear | Yes |
| R2 | Thesis card: who buys, who supplies, why Fleek wins, plus the current state on joinfleek.com | Yes |
| R3 | Bundle P&L: supplier cost by grade A/B/C, FleekSort grading cost, take rate, freight, returns and dispute leakage, buyer CAC, payback | Yes |
| R4 | Monthly ramp to £5M GMV with editable assumptions | Yes, 24 months, supply- vs demand-bound per month |
| R5 | Live sensitivity tables | One-way (±20%) on 10 inputs, plus three two-way tables |
| R6 | Stage-gate scorecard: repeat-buyer rate, dispute rate under a set %, contribution per bundle, grading agreement, each with scale and kill lines | Yes, plus a minimum sample per metric |
| R7 | Risks and open questions | Yes, with severity, next step, add/close/reopen |
| R8 | Every assumption labelled sourced / estimated / placeholder, with a link when sourced | Yes; editing a sourced value relabels it estimated |
| R9 | Export a one-page printable bet memo | Yes, A4 via print |
| R10 | Opens with no sign-in | Static site on GitHub Pages |
| R11 | Fleek look: literal logo top-left, Montserrat, Fleek colours | Yes, see brand sheet |

## Decision rules

- **Kill** if any metric with at least its minimum sample crosses the kill line.
- **Scale** only if every metric clears the scale line on at least its minimum sample.
- **Hold** otherwise, listing each gap (not measured, sample too small, between the lines).
- **Invalid** if a kill line sits on the scale side of its scale line. The desk refuses to call the gate.
- The bundle model refuses to compute if the grade mix does not sum to 100% or the take rate is 100% or more.

## Model definitions

- Goods price = supplier payout ÷ (1 − take rate). Take revenue = goods price − payout. TechCrunch reports Fleek "take[s] a cut on the payment"; the rate is a placeholder.
- Bundle GMV = goods price + shipping built into the price ("Shipping Inc." on listings).
- Contribution = take revenue + (shipping charged − freight) − grading − payments − dispute leakage.
- Dispute leakage = GMV × dispute rate × refund share × (1 − supplier recovery).
- CAC per bundle = share of buyers new to Fleek × CAC ÷ bundles per buyer per year. Payback = CAC ÷ (contribution × bundles per year ÷ 12).
- Ramp: suppliers grow linearly to a cap; supply bundles = suppliers × bundles per supplier × sell-through. Active buyers = last month × retention + buyers added. Bundles sold = min(supply, demand). Target reached in the first month with GMV × 12 ≥ target.

## Out of scope

Real Fleek data or integrations, sign-in, multi-user editing, CSV import, currency handling beyond one labelled USD→GBP rate, seasonality. See the [v2 roadmap](roadmap-v2.md).
