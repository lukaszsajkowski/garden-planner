import { area, bbox, centroid, dist, perimeter, pointInPolygon, ptsAttr, rectPoints, segmentDistance } from './geometry';
import type { Pt } from './types';

const square: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
const lShape: Pt[] = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 3], [0, 3]];

describe('geometry', () => {
  it('dist', () => {
    expect(dist([0, 0], [3, 4])).toBe(5);
  });
  it('area is orientation-independent', () => {
    expect(area(square)).toBe(100);
    expect(area([...square].reverse())).toBe(100);
    expect(area(lShape)).toBe(6);
  });
  it('perimeter is closed', () => {
    expect(perimeter(square)).toBe(40);
    expect(perimeter(lShape)).toBe(14);
  });
  it('bbox', () => {
    expect(bbox(lShape)).toEqual([0, 0, 4, 3]);
  });
  it('centroid of square and degenerate polygon', () => {
    expect(centroid(square)).toEqual([5, 5]);
    expect(centroid([[0, 0], [2, 0], [4, 0]])).toEqual([2, 0]);
  });
  it('pointInPolygon handles concave shapes', () => {
    expect(pointInPolygon([0.5, 2], lShape)).toBe(true);
    expect(pointInPolygon([2, 0.5], lShape)).toBe(true);
    expect(pointInPolygon([2, 2], lShape)).toBe(false);
    expect(pointInPolygon([11, 5], square)).toBe(false);
  });
  it('segmentDistance clamps to the segment', () => {
    expect(segmentDistance([5, 3], [0, 0], [10, 0])).toEqual({ d: 3, q: [5, 0] });
    expect(segmentDistance([12, 0], [0, 0], [10, 0])).toEqual({ d: 2, q: [10, 0] });
    expect(segmentDistance([3, 4], [0, 0], [0, 0])).toEqual({ d: 5, q: [0, 0] });
  });
  it('rectPoints normalises corners clockwise from top-left', () => {
    expect(rectPoints([4, 5], [1, 2])).toEqual([[1, 2], [4, 2], [4, 5], [1, 5]]);
  });
  it('ptsAttr', () => {
    expect(ptsAttr([[0, 0], [1.5, 2]])).toBe('0,0 1.5,2');
  });
});
