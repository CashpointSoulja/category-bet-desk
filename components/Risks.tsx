'use client';
import { useState } from 'react';
import type { RiskItem } from '@/lib/categories';

export function Risks({ risks, onToggle, onAdd, onRemove }: { risks: RiskItem[]; onToggle: (id: string) => void; onAdd: (r: RiskItem) => void; onRemove: (id: string) => void }) {
  const [kind, setKind] = useState<RiskItem['kind']>('risk');
  const [text, setText] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [severity, setSeverity] = useState<RiskItem['severity']>('medium');
  const groups: [RiskItem['kind'], string][] = [['risk', 'Risks'], ['question', 'Open questions']];
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      {groups.map(([k, title]) => (
        <div className="card" key={k}>
          <h3>{title} <span className="muted small">({risks.filter((r) => r.kind === k && r.open).length} open)</span></h3>
          {risks.filter((r) => r.kind === k).length === 0 && <p className="muted small">None logged.</p>}
          {risks
            .filter((r) => r.kind === k)
            .map((r) => (
              <div key={r.id} className={`risk${r.open ? '' : ' closed'}`}>
                <div className="sev-cell"><span className={`sev sev-${r.severity}`}>{r.severity}</span></div>
                <div>
                  <div className="risk-text">{r.text}</div>
                  <div className="tiny muted"><strong>Next step:</strong> {r.nextStep || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                  <button className="btn btn-sm" onClick={() => onToggle(r.id)} aria-label={`${r.open ? 'Close' : 'Reopen'}: ${r.text}`}>{r.open ? 'Close' : 'Reopen'}</button>
                  {r.id.startsWith('u-') && <button className="btn btn-sm" onClick={() => onRemove(r.id)} aria-label={`Remove: ${r.text}`}>Remove</button>}
                </div>
              </div>
            ))}
        </div>
      ))}
      <form
        className="card card-cream"
        style={{ gridColumn: '1 / -1' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onAdd({ id: `u-${Date.now()}`, kind, text: text.trim(), nextStep: nextStep.trim(), severity, open: true });
          setText('');
          setNextStep('');
        }}
      >
        <h3>Log a risk or question</h3>
        <div className="risk-form">
          <select aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value as RiskItem['kind'])}>
            <option value="risk">Risk</option>
            <option value="question">Open question</option>
          </select>
          <input aria-label="Risk or question" placeholder="What could break the bet?" value={text} onChange={(e) => setText(e.target.value)} />
          <input aria-label="Next step" placeholder="Next step to resolve it" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
          <select aria-label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value as RiskItem['severity'])}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={!text.trim()}>Add</button>
        </div>
      </form>
    </div>
  );
}
