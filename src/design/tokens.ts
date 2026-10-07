import raw from '../../design/tokens.json';

export const tokens = raw;

type ColorMap = typeof raw.color;
export type ColorName = {
  [K in keyof ColorMap]: ColorMap[K] extends { value: string } ? K : never;
}[keyof ColorMap];

export function color(name: ColorName): string {
  return (raw.color[name] as { value: string }).value;
}

export const material = raw.material;
export const canvasTokens = raw.canvas;
export const exportTokens = raw.export;
