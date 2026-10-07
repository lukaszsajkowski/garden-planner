import { CATALOG, ORDER_POLY, ORDER_POINT, isPoly, isPolyType, defaultRadius, isShapeType } from './catalog';
import { newId } from './ids';

describe('catalog', () => {
  it('has z-order from PRD 6.1', () => {
    expect(CATALOG.boundary.z).toBe(0);
    expect(CATALOG.grass.z).toBe(1);
    expect(CATALOG.gravel.z).toBe(2);
    expect(CATALOG.paving.z).toBe(2);
    expect(CATALOG.bed.z).toBe(3);
    expect(CATALOG.house.z).toBe(4);
    expect([CATALOG.shrub.z, CATALOG.conifer.z, CATALOG.tree.z]).toEqual([5, 6, 7]);
  });
  it('lists tools in UI order', () => {
    expect(ORDER_POLY).toEqual(['boundary', 'grass', 'paving', 'gravel', 'bed', 'house']);
    expect(ORDER_POINT).toEqual(['tree', 'conifer', 'shrub']);
  });
  it('has Polish labels and default radii', () => {
    expect(CATALOG.paving.label).toBe('Kostka brukowa');
    expect(CATALOG.house.label).toBe('Dom / budynek');
    expect(defaultRadius('shrub')).toBe(0.6);
    expect(defaultRadius('conifer')).toBe(1);
    expect(defaultRadius('tree')).toBe(2.5);
  });
  it('narrows shapes and types', () => {
    expect(isPolyType('bed')).toBe(true);
    expect(isPolyType('tree')).toBe(false);
    expect(isPoly({ id: 'a', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] })).toBe(true);
    expect(isPoly({ id: 'b', type: 'tree', x: 0, y: 0, r: 1 })).toBe(false);
  });
  it('isShapeType rejects inherited object keys', () => {
    expect(isShapeType('grass')).toBe(true);
    expect(isShapeType('toString')).toBe(false);
    expect(isShapeType(5)).toBe(false);
  });
  it('newId returns unique string ids', () => {
    const a = newId(), b = newId();
    expect(a).toMatch(/^e[0-9a-z]+$/);
    expect(a).not.toBe(b);
  });
});
