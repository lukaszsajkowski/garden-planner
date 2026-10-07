export function round2(v: number): number {
  const r = Math.round(v * 100) / 100;
  return r === 0 ? 0 : r;
}
export function fmtNum(v: number): string {
  return String(round2(v)).replace('.', ',');
}
export function fmtLen(v: number): string {
  return v.toFixed(2).replace('.', ',') + ' m';
}
export function fmtArea(a: number): string {
  return (a >= 100 ? a.toFixed(0) : a.toFixed(1)).replace('.', ',') + ' m²';
}
export function parseNum(str: string): number {
  const t = String(str).trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.') return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}
export function dateStamp(d: Date = new Date()): string {
  const p = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
