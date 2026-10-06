'use client';
import type { GateMetric, GateResult, MetricId } from '@/lib/engine';
import { fmtMetric } from '@/lib/engine';
import { BasisChip } from './Basis';

const STATUS_LABEL = { scale: 'Scale', hold: 'Hold', kill: 'Kill', insufficient: 'Sample too small', 'no-data': 'Not measured', invalid: 'Invalid thresholds' } as const;

type Field = 'scaleAt' | 'killAt' | 'minSample' | 'observed' | 'sample';

export function Scorecard({ metrics, gate, onChange }: { metrics: GateMetric[]; gate: GateResult; onChange: (id: MetricId, f: Field, v: number | null) => void }) {
  return (
    <>
      <div className={`verdict verdict-${gate.verdict}`} role="status" aria-live="polite">
        <div>
          <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Gate call</div>
          <div className="verdict-word">{gate.verdict}</div>
          <div className="tiny">{gate.measured} of {gate.total} metrics measured on an adequate sample</div>
        </div>
        <ul style={{ flex: 1, minWidth: 240 }}>
          {gate.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th className="r">Scale at</th>
              <th className="r">Kill at</th>
              <th className="r">Min n</th>
              <th className="r">Observed</th>
              <th className="r">n</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const s = gate.statuses[m.id];
              const cmp = m.direction === 'higher' ? '≥' : '≤';
              const kcmp = m.direction === 'higher' ? '<' : '>';
              return (
                <tr key={m.id}>
                  <td style={{ minWidth: 220 }}>
                    <strong>{m.label}</strong>
                    <div className="tiny muted">{m.definition}</div>
                    <div className="tiny" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                      Thresholds <BasisChip basis={m.thresholdBasis} source={m.thresholdBasis === 'sourced' ? m.source : undefined} />
                      <span className="muted">{m.thresholdNote}</span>
                      {m.source && m.thresholdBasis !== 'sourced' && (
                        <a className="muted" href={m.source.url} target="_blank" rel="noreferrer">{m.source.label} ↗</a>
                      )}
                    </div>
                  </td>
                  <Cell label={`${m.label} scale threshold (${cmp})`} prefix={cmp} unit={m.unit} value={m.scaleAt} onChange={(v) => onChange(m.id, 'scaleAt', v ?? 0)} />
                  <Cell label={`${m.label} kill threshold (${kcmp})`} prefix={kcmp} unit={m.unit} value={m.killAt} onChange={(v) => onChange(m.id, 'killAt', v ?? 0)} />
                  <Cell label={`${m.label} minimum sample`} unit="" value={m.minSample} onChange={(v) => onChange(m.id, 'minSample', v ?? 0)} />
                  <Cell label={`${m.label} observed`} unit={m.unit} value={m.observed} onChange={(v) => onChange(m.id, 'observed', v)} nullable />
                  <Cell label={`${m.label} sample size in ${m.sampleUnit}`} unit="" value={m.sample} onChange={(v) => onChange(m.id, 'sample', v)} nullable />
                  <td>
                    <span className={`chip chip-${s}`}>{STATUS_LABEL[s]}</span>
                    {m.observed !== null && <div className="tiny muted" style={{ marginTop: 3 }}>{fmtMetric(m.observed, m.unit)} on n={m.sample ?? 0}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Cell({ label, value, unit, prefix, onChange, nullable }: { label: string; value: number | null; unit: string; prefix?: string; onChange: (v: number | null) => void; nullable?: boolean }) {
  return (
    <td className="r" style={{ whiteSpace: 'nowrap' }}>
      {prefix && <span className="tiny muted">{prefix} </span>}
      {unit === '£' && <span className="tiny muted">£</span>}
      <input
        aria-label={label}
        className={`score-input${value === null ? ' empty' : ''}`}
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        placeholder={nullable ? '—' : undefined}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange(nullable ? null : 0);
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n)) onChange(n);
        }}
      />
      {unit === '%' && <span className="tiny muted">%</span>}
    </td>
  );
}
