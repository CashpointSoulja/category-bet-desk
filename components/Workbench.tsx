'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { CATEGORIES, getCategory, type CategoryBet } from '@/lib/categories';
import { basisCounts, bundleEconomics, evaluateGate, ramp, validate, valuesOf, type AssumptionKey } from '@/lib/model';
import { initialState, load, reducer, save } from '@/lib/state';
import { gbp, gbpShort } from '@/lib/format';
import { asset } from '@/lib/asset';
import { SOURCES } from '@/lib/sources';
import { BasisChip } from './Basis';
import { AssumptionEditor } from './AssumptionEditor';
import { Thesis } from './Thesis';
import { AnchorCheck, EconomicsKpis, Waterfall } from './Economics';
import { RampChart, RampTable, SensitivityGrids, Tornado } from './Ramp';
import { Scorecard } from './Scorecard';
import { Risks } from './Risks';
import { Memo } from './Memo';

const BUNDLE_GROUPS: { title: string; keys: AssumptionKey[] }[] = [
  { title: 'Bundle and grade mix', keys: ['piecesPerBundle', 'gradeA', 'gradeB', 'gradeC'] },
  { title: 'Supplier cost', keys: ['supplierCostA', 'supplierCostB', 'supplierCostC'] },
  { title: 'Fleek revenue and costs', keys: ['takeRate', 'gradingCostPerPiece', 'shippingCharged', 'kgPerPiece', 'freightPerKg', 'paymentCostPct'] },
  { title: 'Returns and disputes', keys: ['disputeRate', 'refundShare', 'supplierRecovery'] },
  { title: 'Buyer acquisition', keys: ['buyerCac', 'newBuyerShare', 'bundlesPerBuyerYear'] },
];
const RAMP_GROUPS: { title: string; keys: AssumptionKey[] }[] = [
  { title: 'Supply', keys: ['startSuppliers', 'suppliersAddedPerMonth', 'maxSuppliers', 'bundlesPerSupplierMonth', 'sellThrough'] },
  { title: 'Demand', keys: ['startBuyers', 'newBuyersPerMonth', 'buyerRetention', 'bundlesPerBuyerMonth'] },
  { title: 'Target', keys: ['targetAnnualGmv'] },
];

function previewGate(c: CategoryBet) {
  return evaluateGate(c.metrics);
}

export default function Workbench() {
  const [betId, setBetId] = useState<CategoryBet['id']>(CATEGORIES[0].id);
  const bet = getCategory(betId);
  return <Desk key={bet.id} bet={bet} onPick={setBetId} />;
}

function Desk({ bet, onPick }: { bet: CategoryBet; onPick: (id: CategoryBet['id']) => void }) {
  const [s, dispatch] = useReducer(reducer(bet), bet, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [date, setDate] = useState('');
  useEffect(() => {
    const saved = load(bet);
    if (saved) dispatch({ type: 'replace', state: saved });
    setHydrated(true);
    setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, [bet]);
  useEffect(() => {
    if (hydrated) save(bet, s);
  }, [bet, s, hydrated]);

  const v = useMemo(() => valuesOf(s.assumptions), [s.assumptions]);
  const issues = useMemo(() => validate(v), [v]);
  const ok = issues.length === 0;
  const e = useMemo(() => bundleEconomics(v), [v]);
  const r = useMemo(() => ramp(v), [v]);
  const gate = useMemo(() => evaluateGate(s.metrics), [s.metrics]);
  const counts = basisCounts(s.assumptions);
  const setA = (key: AssumptionKey, value: number) => dispatch({ type: 'setAssumption', key, value });

  return (
    <>
      <div className="screen">
        <div className="strip">
          <strong>Independent concept</strong> by Ayomide Ahmed · not an official Fleek product · public data and labelled estimates only
        </div>
        <header className="header">
          <div className="wrap header-inner">
            <a className="brand" href="#top" aria-label="Category Bet Desk, top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/brand/fleek-logo.webp')} alt="Fleek logo" width={113} height={30} />
              <span className="brand-divider" />
              <span>
                <span className="brand-name">Category Bet Desk</span>
                <br />
                <span className="brand-sub">Special Projects · Category Expansion</span>
              </span>
            </a>
            <nav className="nav" aria-label="Sections">
              <a href="#thesis">Thesis</a>
              <a href="#economics">Economics</a>
              <a href="#ramp">Path to £5M</a>
              <a href="#gates">Gates</a>
              <a href="#risks">Risks</a>
            </nav>
            <button className="btn btn-primary" onClick={() => window.print()} disabled={!ok} title={ok ? 'Opens the print dialog with a one-page memo' : 'Fix the input errors first'}>
              <span className="lbl-long">Export bet memo</span>
              <span className="lbl-short">Export memo</span>
            </button>
          </div>
        </header>

        <main id="top">
          <section className="hero">
            <div className="wrap">
              <span className="eyebrow">Category bets · thesis to £5M GMV</span>
              <h1>
                Pick a bet. <span className="accent">Prove the economics</span> or kill it.
              </h1>
              <p className="lede">
                Each bet carries a thesis, a per-bundle P&amp;L, a monthly ramp to {gbpShort(v.targetAnnualGmv)} GMV and scale-or-kill thresholds set before the first pilot reading. Every input is labelled sourced, estimated or placeholder.
              </p>
              <div className="picker" role="group" aria-label="Candidate categories">
                {CATEGORIES.map((c) => {
                  const cv = c.id === bet.id ? v : valuesOf(c.assumptions);
                  const ce = bundleEconomics(cv);
                  const cr = c.id === bet.id ? r : ramp(cv);
                  const cg = c.id === bet.id ? gate : previewGate(c);
                  return (
                    <button key={c.id} className="bet-card" aria-pressed={c.id === bet.id} onClick={() => onPick(c.id)}>
                      <div className="bet-tile" style={{ background: c.tile }}>
                        <span className="status">{c.status}</span>
                      </div>
                      <div className="bet-body">
                        <div className="bet-name">{c.name} <span className="chip chip-no-data status-m">{c.status}</span></div>
                        <div className="price-row">
                          <span className="price">{gbp(ce.gmv)}</span>
                          <span className="ppc">{gbp(ce.buyerPricePerPiece)}/pc</span>
                          <span className="chip chip-ship">Shipping Inc.</span>
                        </div>
                        <div className="small muted">
                          {gbp(ce.contribution)} contribution/bundle · {cr.monthReachingTarget ? `£5M run-rate M${cr.monthReachingTarget}` : '£5M not reached in 24 mo'}
                        </div>
                        <div><span className={`chip chip-${cg.verdict}`}>Gate: {cg.verdict}</span> <span className="tiny muted">{cg.measured}/{cg.total} measured</span></div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="legend" aria-label="Assumption labels">
                <span><BasisChip basis="sourced" source={SOURCES.jobPost} /> public source, linked</span>
                <span><BasisChip basis="estimated" /> reasoned estimate</span>
                <span><BasisChip basis="placeholder" /> stand-in until measured</span>
                <span className="muted">This bet: {counts.sourced} sourced · {counts.estimated} estimated · {counts.placeholder} placeholder</span>
                <button className="btn btn-sm" onClick={() => dispatch({ type: 'reset' })}>Reset this bet</button>
              </div>
            </div>
          </section>

          <section className="section" id="thesis">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <h2><span className="step">1</span>Thesis: {bet.name}</h2>
                  <p className="muted">Who buys, who supplies, and why Fleek is placed to win this category.</p>
                </div>
              </div>
              <Thesis bet={bet} />
            </div>
          </section>

          <section className="section" id="economics">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <h2><span className="step">2</span>Unit economics per bundle</h2>
                  <p className="muted">Fleek&apos;s side of one bundle. The supplier is paid their price; commission comes out of what the buyer pays; shipping is built into the price and Fleek pays the freight.</p>
                </div>
              </div>
              {!ok && (
                <div className="issue" role="alert">
                  The model will not calculate until these are fixed: {issues.map((i) => i.message).join(' ')}
                </div>
              )}
              <div className="grid-econ">
                <div className="card">
                  <AssumptionEditor groups={BUNDLE_GROUPS} assumptions={s.assumptions} onChange={setA} />
                </div>
                <div>
                  {ok ? (
                    <>
                      <EconomicsKpis e={e} />
                      <div className="card">
                        <Waterfall e={e} v={v} />
                        <AnchorCheck e={e} anchor={bet.anchor} />
                      </div>
                    </>
                  ) : (
                    <div className="card muted">No margin shown while inputs are invalid.</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="ramp" style={{ background: 'var(--cream)' }}>
            <div className="wrap">
              <div className="section-head">
                <div>
                  <h2><span className="step">3</span>Path to {gbpShort(v.targetAnnualGmv)} GMV</h2>
                  <p className="muted">Monthly bundles sold are the lower of what suppliers can list and what active buyers will buy. The target is a monthly GMV run-rate of {gbpShort(v.targetAnnualGmv / 12)}.</p>
                </div>
                {ok && (
                  <div className="kpi" style={{ background: 'var(--white)', minWidth: 220 }}>
                    <div className="kpi-label">Hits £5M run-rate</div>
                    <div className="kpi-value">{r.monthReachingTarget ? `Month ${r.monthReachingTarget}` : 'Not in 24 mo'}</div>
                    <div className="kpi-sub">Peak {gbpShort(r.peakRunRate)}/yr · trailing 12 mo {gbpShort(r.trailing12Gmv)}</div>
                  </div>
                )}
              </div>
              <div className="grid-econ grid-ramp">
                <div className="card">
                  <AssumptionEditor groups={RAMP_GROUPS} assumptions={s.assumptions} onChange={setA} />
                </div>
                <div className="card">
                  {ok ? (
                    <>
                      <RampChart r={r} target={v.targetAnnualGmv} />
                      <RampTable r={r} />
                    </>
                  ) : (
                    <p className="muted">No ramp shown while inputs are invalid.</p>
                  )}
                </div>
              </div>
              {ok && (
                <div className="grid-2 grid-sens" style={{ marginTop: 18, alignItems: 'start' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: 8 }}>Sensitivity: what moves contribution most</h3>
                    <Tornado v={v} a={s.assumptions} />
                  </div>
                  <div className="card">
                    <h3 style={{ marginBottom: 8 }}>Sensitivity tables</h3>
                    <SensitivityGrids v={v} a={s.assumptions} />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="section" id="gates">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <h2><span className="step">4</span>Stage-gate scorecard</h2>
                  <p className="muted">Scale and kill lines are set before the pilot. One kill on an adequate sample kills the bet; scaling needs every metric past its scale line. Missing or thin evidence holds.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {s.pilotLoaded ? (
                    <button className="btn btn-sm" onClick={() => dispatch({ type: 'clearPilot' })}>Clear pilot readings</button>
                  ) : (
                    <button className="btn btn-sm btn-yellow" onClick={() => dispatch({ type: 'loadPilot' })}>Load illustrative pilot readings</button>
                  )}
                </div>
              </div>
              {s.pilotLoaded && (
                <p className="small" style={{ background: 'var(--amber-bg)', padding: '8px 12px', borderRadius: 8 }}>
                  <BasisChip basis="placeholder" /> These pilot readings are made up to show how the gate behaves. They are not Fleek data.
                </p>
              )}
              <Scorecard metrics={s.metrics} gate={gate} onChange={(id, field, value) => dispatch({ type: 'setMetric', id, field, value })} />
              {ok && (
                <p className="small muted" style={{ marginTop: 10 }}>
                  For reference, the model above predicts {gbp(e.contribution)} contribution per bundle at a {v.disputeRate}% dispute rate. The gate reads observed pilot values, not the model.
                </p>
              )}
            </div>
          </section>

          <section className="section" id="risks">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <h2><span className="step">5</span>Risks and open questions</h2>
                  <p className="muted">Each one carries the next step that would resolve it. Open items print on the memo.</p>
                </div>
                <button className="btn btn-primary" onClick={() => window.print()} disabled={!ok}>Export bet memo</button>
              </div>
              <Risks risks={s.risks} onToggle={(id) => dispatch({ type: 'toggleRisk', id })} onAdd={(risk) => dispatch({ type: 'addRisk', risk })} onRemove={(id) => dispatch({ type: 'removeRisk', id })} />
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="wrap footer-grid">
            <div>
              <div className="footer-main">independent concept by Ayomide Ahmed</div>
              <p>
                Not an official Fleek product and not affiliated with or endorsed by Fleek. The Fleek name and logo belong to Fleek and are used only to show how the concept would sit in its product. No Fleek internal data is used: every number is a public figure with a link, a labelled estimate, or a labelled placeholder. Edits are saved only in this browser.
              </p>
            </div>
            <div>
              <strong style={{ color: 'var(--white)' }}>Public sources</strong>
              <ul>
                {[SOURCES.jobPost, SOURCES.careers, SOURCES.fortune, SOURCES.tnw, SOURCES.trustpilot, SOURCES.howItWorks].map((x) => (
                  <li key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </footer>
      </div>
      {ok && <Memo bet={bet} s={s} v={v} e={e} r={r} gate={gate} date={date} />}
    </>
  );
}
