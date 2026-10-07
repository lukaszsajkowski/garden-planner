import { applyCalibration, fitBackgroundWidth, newBackground } from './background';

const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('background', () => {
  it('fits the image into the drawing area', () => {
    expect(fitBackgroundWidth(30, 22, 0.5)).toBe(30);
    expect(fitBackgroundWidth(30, 22, 1)).toBe(22);
    expect(fitBackgroundWidth(30, 22, 3)).toBe(7.333);
    expect(newBackground('data:image/png;base64,A', 1, 30, 22)).toEqual({ src: 'data:image/png;base64,A', x: 0, y: 0, w: 22, aspect: 1, opacity: 0.6, visible: true });
  });

  it('scales around the first point and grows the drawing area', () => {
    const r = applyCalibration(bg, [[0, 0], [10, 0]], 25, 30, 22);
    expect(r).toEqual({ bg: { ...bg, w: 50, x: 0, y: 0 }, W: 50, H: 25 });
  });

  it('keeps the first point fixed, clamping position at 0', () => {
    const r = applyCalibration({ ...bg, x: 2, y: 2 }, [[4, 2], [6, 2]], 1, 30, 22);
    expect(r?.bg).toMatchObject({ w: 10, x: 3, y: 2 });
    const r2 = applyCalibration(bg, [[4, 2], [6, 2]], 4, 30, 22);
    expect(r2?.bg).toMatchObject({ w: 40, x: 0, y: 0 });
  });

  it('caps the drawing area at 500 m', () => {
    const r = applyCalibration(bg, [[0, 0], [1, 0]], 100, 30, 22);
    expect(r?.W).toBe(500);
    expect(r?.H).toBe(500);
  });

  it('returns null for degenerate input instead of NaN/Infinity', () => {
    expect(applyCalibration(bg, [[3, 3], [3, 3]], 10, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0], [1, 0]], 0, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0], [1, 0]], NaN, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0]], 10, 30, 22)).toBeNull();
  });
});
