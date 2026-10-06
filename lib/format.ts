export const gbp = (x: number, dp = 2) =>
  `${x < 0 ? '−' : ''}£${Math.abs(x).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const gbpShort = (x: number) => {
  const a = Math.abs(x);
  const s = a >= 1_000_000 ? `£${+(a / 1_000_000).toFixed(2)}M` : a >= 1_000 ? `£${(a / 1_000).toFixed(0)}k` : `£${a.toFixed(0)}`;
  return x < 0 ? `−${s}` : s;
};

export const pct = (x: number, dp = 1) => `${x.toFixed(dp)}%`;

export const num = (x: number, dp = 0) => x.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export function fmtValue(value: number, unit: string): string {
  switch (unit) {
    case '%':
      return `${num(value, value % 1 ? 1 : 0)}%`;
    case '£':
    case '£/pc':
      return `${gbp(value)}${unit === '£/pc' ? '/pc' : ''}`;
    case '£/kg':
      return `${gbp(value)}/kg`;
    case '£/yr':
      return `${gbpShort(value)}/yr`;
    case 'kg/pc':
      return `${value} kg/pc`;
    default:
      return `${num(value, value % 1 ? 1 : 0)} ${unit === 'count' ? '' : unit}`.trim();
  }
}
