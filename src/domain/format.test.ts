import { round2, fmtNum, fmtLen, fmtArea, parseNum, dateStamp } from './format';

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(2.5)).toBe(2.5);
  });
  it('never returns negative zero', () => {
    expect(Object.is(round2(-0.001), 0)).toBe(true);
  });
});

describe('fmtNum / fmtLen / fmtArea', () => {
  it('uses decimal comma', () => {
    expect(fmtNum(2.5)).toBe('2,5');
    expect(fmtNum(3)).toBe('3');
    expect(fmtNum(1.234)).toBe('1,23');
  });
  it('formats lengths with 2 decimals and unit', () => {
    expect(fmtLen(12.3)).toBe('12,30 m');
    expect(fmtLen(0)).toBe('0,00 m');
  });
  it('formats areas: no decimals from 100 m², else one decimal', () => {
    expect(fmtArea(508.25)).toBe('508 m²');
    expect(fmtArea(100)).toBe('100 m²');
    expect(fmtArea(48.8)).toBe('48,8 m²');
    expect(fmtArea(6)).toBe('6,0 m²');
  });
});

describe('parseNum', () => {
  it('accepts comma and dot, trims spaces', () => {
    expect(parseNum('2,5')).toBe(2.5);
    expect(parseNum(' 3 ')).toBe(3);
    expect(parseNum('-1,25')).toBe(-1.25);
    expect(parseNum('4.75')).toBe(4.75);
  });
  it('returns NaN for anything that is not a plain number', () => {
    for (const s of ['', '-', '.', 'abc', '12.5 m', '1 000', 'Infinity', '1,2,3']) {
      expect(parseNum(s)).toBeNaN();
    }
  });
});

describe('dateStamp', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(dateStamp(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(dateStamp(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
