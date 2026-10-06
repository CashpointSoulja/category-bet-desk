'use client';
import type { Assumption, AssumptionKey, Assumptions } from '@/lib/engine';
import { BasisChip } from './Basis';

const SUFFIX: Record<string, string> = { '%': '%', '£': '£', '£/pc': '£/pc', '£/kg': '£/kg', 'kg/pc': 'kg', pcs: 'pcs', count: '', 'per month': '/mo', 'per year': '/yr', '£/yr': '£/yr' };

export function AssumptionEditor({ groups, assumptions, onChange }: { groups: { title: string; keys: AssumptionKey[] }[]; assumptions: Assumptions; onChange: (k: AssumptionKey, v: number) => void }) {
  return (
    <div className="assumptions">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="a-group">{g.title}</div>
          {g.keys.map((k) => (
            <Row key={k} a={assumptions[k]} onChange={(v) => onChange(k, v)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Row({ a, onChange }: { a: Assumption; onChange: (v: number) => void }) {
  const id = `a-${a.key}`;
  return (
    <div className={`a-row${a.edited ? ' edited' : ''}`}>
      <div>
        <label className="a-label" htmlFor={id}>
          {a.label}
        </label>
        <div className="a-note">{a.edited ? <strong>Edited. </strong> : null}{a.note}</div>
      </div>
      <div className="a-input">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={a.step ?? 1}
          min={0}
          value={Number.isFinite(a.value) ? a.value : ''}
          onChange={(e) => {
            const v = e.target.valueAsNumber;
            if (Number.isFinite(v)) onChange(v);
          }}
        />
        <span>{SUFFIX[a.unit]}</span>
      </div>
      <div className="a-basis">
        <BasisChip basis={a.basis} source={a.source} />
      </div>
    </div>
  );
}
