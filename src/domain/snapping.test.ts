import { displayAngle, draftPoint, pointFromSegment, snapPoint, snapValue } from './snapping';

describe('snapValue / snapPoint', () => {
  it('snaps to step', () => {
    expect(snapValue(1.26, 0.5)).toBe(1.5);
    expect(snapValue(1.26, 0.1)).toBe(1.3);
    expect(snapValue(1.26, 1)).toBe(1);
  });
  it('step 0 only rounds to centimetres', () => {
    expect(snapValue(1.234, 0)).toBe(1.23);
  });
  it('snapPoint', () => {
    expect(snapPoint([1.26, 3.74], 0.5)).toEqual([1.5, 3.5]);
  });
});

describe('draftPoint', () => {
  it('without a previous point it just snaps', () => {
    expect(draftPoint([1.26, 1.74], null, { step: 0.5, angleSnap: true })).toEqual([1.5, 1.5]);
  });
  it('without angle snap it ignores the previous point', () => {
    expect(draftPoint([10.2, 0.9], [0, 0], { step: 0.5, angleSnap: false })).toEqual([10, 1]);
  });
  it('angle snap rounds direction to 15° and length to step', () => {
    expect(draftPoint([10, 0.9], [0, 0], { step: 0.5, angleSnap: true })).toEqual([10, 0]);
  });
  it('angle snap with step 0 keeps length', () => {
    expect(draftPoint([7, 7.3], [0, 0], { step: 0, angleSnap: true })).toEqual([7.15, 7.15]);
  });
});

describe('pointFromSegment (0° right, 90° up, Y grows down)', () => {
  it.each([
    [0, [5, 0]],
    [90, [0, -5]],
    [180, [-5, 0]],
    [270, [0, 5]],
  ] as const)('%i°', (deg, expected) => {
    expect(pointFromSegment([0, 0], 5, deg)).toEqual(expected);
  });
  it('from an arbitrary point', () => {
    expect(pointFromSegment([1, 1], 2, 45)).toEqual([2.41, -0.41]);
  });
});

describe('displayAngle', () => {
  it('uses the same convention and 0–359 range', () => {
    expect(displayAngle([0, 0], [1, 0])).toBe(0);
    expect(displayAngle([0, 0], [1, -1])).toBe(45);
    expect(displayAngle([0, 0], [-1, 0])).toBe(180);
    expect(displayAngle([0, 0], [0, 1])).toBe(270);
  });
});
