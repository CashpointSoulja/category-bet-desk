import type { AssumptionKey, Assumptions, GateMetric, MetricId } from './model';
import type { CategoryBet, RiskItem } from './categories';
import { CATEGORIES } from './categories';

export interface BetState {
  assumptions: Assumptions;
  metrics: GateMetric[];
  risks: RiskItem[];
  pilotLoaded: boolean;
}

export type Action =
  | { type: 'setAssumption'; key: AssumptionKey; value: number }
  | { type: 'setMetric'; id: MetricId; field: 'scaleAt' | 'killAt' | 'minSample' | 'observed' | 'sample'; value: number | null }
  | { type: 'loadPilot' }
  | { type: 'clearPilot' }
  | { type: 'toggleRisk'; id: string }
  | { type: 'addRisk'; risk: RiskItem }
  | { type: 'removeRisk'; id: string }
  | { type: 'reset' }
  | { type: 'replace'; state: BetState };

export function initialState(bet: CategoryBet): BetState {
  return structuredClone({ assumptions: bet.assumptions, metrics: bet.metrics, risks: bet.risks, pilotLoaded: false });
}

export function reducer(bet: CategoryBet) {
  return (s: BetState, a: Action): BetState => {
    switch (a.type) {
      case 'setAssumption': {
        const prev = s.assumptions[a.key];
        if (!Number.isFinite(a.value)) return s;
        const original = bet.assumptions[a.key];
        const backToOriginal = a.value === original.value;
        const next = backToOriginal
          ? { ...original }
          : {
              ...prev,
              value: a.value,
              edited: true,
              // An edited sourced value is no longer what the source says.
              basis: original.basis === 'sourced' ? ('estimated' as const) : original.basis,
              note: original.basis === 'sourced' ? `Edited by bet owner. Source value was ${original.value}. ${original.note}` : original.note,
            };
        return { ...s, assumptions: { ...s.assumptions, [a.key]: next } };
      }
      case 'setMetric':
        return { ...s, metrics: s.metrics.map((m) => (m.id === a.id ? { ...m, [a.field]: a.value } : m)) };
      case 'loadPilot':
        return { ...s, pilotLoaded: true, metrics: s.metrics.map((m) => ({ ...m, ...bet.illustrativePilot[m.id] })) };
      case 'clearPilot':
        return { ...s, pilotLoaded: false, metrics: s.metrics.map((m) => ({ ...m, observed: null, sample: null })) };
      case 'toggleRisk':
        return { ...s, risks: s.risks.map((r) => (r.id === a.id ? { ...r, open: !r.open } : r)) };
      case 'addRisk':
        return { ...s, risks: [...s.risks, a.risk] };
      case 'removeRisk':
        return { ...s, risks: s.risks.filter((r) => r.id !== a.id) };
      case 'reset':
        return initialState(bet);
      case 'replace':
        return a.state;
    }
  };
}

const KEY = (id: string) => `category-bet-desk:v1:${id}`;

export function load(bet: CategoryBet): BetState | null {
  try {
    const raw = localStorage.getItem(KEY(bet.id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BetState;
    // Drop saved state if the preload has gained or lost assumptions since it was saved.
    const keys = Object.keys(bet.assumptions);
    if (keys.some((k) => !(k in parsed.assumptions)) || parsed.metrics.length !== bet.metrics.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function save(bet: CategoryBet, s: BetState) {
  try {
    localStorage.setItem(KEY(bet.id), JSON.stringify(s));
  } catch {
    /* storage full or blocked: the desk still works for the session */
  }
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
