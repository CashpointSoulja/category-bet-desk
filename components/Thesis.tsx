import type { CategoryBet, ThesisPoint } from '@/lib/categories';
import { BasisChip, SourceLink } from './Basis';

function Points({ title, points }: { title: string; points: ThesisPoint[] }) {
  return (
    <div className="card thesis-col">
      <h3>{title}</h3>
      <ul>
        {points.map((p) => (
          <li key={p.text}>
            <span>{p.text}</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <BasisChip basis={p.basis} source={p.source} />
              {p.basis !== 'sourced' && <SourceLink source={p.source} />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Thesis({ bet }: { bet: CategoryBet }) {
  const c = bet.thesis.currentState;
  return (
    <>
      <div className="card card-cream current">
        <div>
          <strong>Starting point.</strong> {c.text}{' '}
          <BasisChip basis={c.basis} source={c.source} />
        </div>
      </div>
      <div className="grid-3">
        <Points title="Who buys" points={bet.thesis.whoBuys} />
        <Points title="Who supplies" points={bet.thesis.whoSupplies} />
        <Points title="Why Fleek wins" points={bet.thesis.whyFleekWins} />
      </div>
    </>
  );
}
