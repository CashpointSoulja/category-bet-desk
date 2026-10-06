import type { Basis, SourceRef } from '@/lib/model';

const LABEL: Record<Basis, string> = { sourced: 'Sourced', estimated: 'Estimated', placeholder: 'Placeholder' };

export function BasisChip({ basis, source }: { basis: Basis; source?: SourceRef }) {
  if (source && basis === 'sourced') {
    return (
      <a className={`basis basis-${basis}`} href={source.url} target="_blank" rel="noreferrer" title={`Source: ${source.label}`}>
        {LABEL[basis]} ↗
      </a>
    );
  }
  return (
    <span className={`basis basis-${basis}`} title={source ? `Reference: ${source.label}` : undefined}>
      {LABEL[basis]}
    </span>
  );
}

export function SourceLink({ source }: { source?: SourceRef }) {
  if (!source) return null;
  return (
    <a className="tiny muted" href={source.url} target="_blank" rel="noreferrer">
      {source.label}
    </a>
  );
}
