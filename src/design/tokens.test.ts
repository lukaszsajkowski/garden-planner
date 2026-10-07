import { color, material, canvasTokens } from './tokens';

describe('tokens', () => {
  it('reads color values by name', () => {
    expect(color('accent')).toBe('#2F6B3F');
    expect(color('selection')).toBe('#C2561A');
  });
  it('exposes material and canvas groups', () => {
    expect(material.grass.solid).toBe('#A8CF85');
    expect(canvasTokens.zoomSteps).toEqual([8, 12, 16, 20, 28, 36, 48, 64, 80]);
  });
});
