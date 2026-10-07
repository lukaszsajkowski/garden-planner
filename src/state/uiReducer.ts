import { DEFAULT_ZOOM, ZOOMS } from '../domain/catalog';
import type { Pt, ShapeType } from '../domain/types';

export type Tool = 'select' | ShapeType;
export type BgMode = null | 'calib' | 'move';
export type DrawInputKey = 'startX' | 'startY' | 'segLen' | 'segAng' | 'rectW' | 'rectH';
export interface Notice { msg: string; download?: { url: string; name: string } }

export interface UiState {
  tool: Tool;
  mode: 'poly' | 'rect';
  draft: Pt[];
  rectStart: Pt | null;
  hover: Pt | null;
  sel: string | null;
  scale: number;
  step: number;
  angleSnap: boolean;
  showDims: boolean;
  showLabels: boolean;
  bgMode: BgMode;
  calib: Pt[];
  calibLen: string;
  drawInputs: Record<DrawInputKey, string>;
  notice: Notice | null;
}

export const initialUi: UiState = {
  tool: 'select', mode: 'poly', draft: [], rectStart: null, hover: null, sel: null,
  scale: DEFAULT_ZOOM, step: 0.5, angleSnap: false, showDims: true, showLabels: true,
  bgMode: null, calib: [], calibLen: '',
  drawInputs: { startX: '0', startY: '0', segLen: '', segAng: '0', rectW: '10', rectH: '8' },
  notice: null,
};

export type UiAction =
  | { type: 'ui/setTool'; tool: Tool }
  | { type: 'ui/setMode'; mode: 'poly' | 'rect' }
  | { type: 'ui/draftSet'; pts: Pt[] }
  | { type: 'ui/draftAdd'; pt: Pt }
  | { type: 'ui/draftPop' }
  | { type: 'ui/rectStart'; pt: Pt | null }
  | { type: 'ui/hover'; pt: Pt | null }
  | { type: 'ui/select'; id: string | null }
  | { type: 'ui/pickElement'; id: string }
  | { type: 'ui/zoom'; dir: 1 | -1 }
  | { type: 'ui/setStep'; step: number }
  | { type: 'ui/toggle'; key: 'angleSnap' | 'showDims' | 'showLabels' }
  | { type: 'ui/setBgMode'; mode: BgMode }
  | { type: 'ui/toggleBgMode'; mode: 'calib' | 'move' }
  | { type: 'ui/calibClick'; pt: Pt }
  | { type: 'ui/setCalibLen'; value: string }
  | { type: 'ui/setDrawInput'; key: DrawInputKey; value: string }
  | { type: 'ui/notify'; notice: Notice | null }
  | { type: 'ui/appendNotice'; msg: string };

export function uiReducer(s: UiState, a: UiAction): UiState {
  switch (a.type) {
    case 'ui/setTool':
      return { ...s, tool: a.tool, draft: [], rectStart: null, sel: a.tool === 'select' ? s.sel : null, bgMode: null, calib: [] };
    case 'ui/setMode':
      return a.mode === 'poly' ? { ...s, mode: 'poly', rectStart: null } : { ...s, mode: 'rect', draft: [] };
    case 'ui/draftSet':
      return { ...s, draft: a.pts };
    case 'ui/draftAdd':
      return { ...s, draft: [...s.draft, a.pt] };
    case 'ui/draftPop':
      return { ...s, draft: s.draft.slice(0, -1) };
    case 'ui/rectStart':
      return { ...s, rectStart: a.pt };
    case 'ui/hover':
      return { ...s, hover: a.pt };
    case 'ui/select':
      return { ...s, sel: a.id };
    case 'ui/pickElement':
      return { ...s, sel: a.id, tool: 'select', draft: [], rectStart: null, bgMode: null, calib: [] };
    case 'ui/zoom': {
      const i = ZOOMS.indexOf(s.scale);
      const next = Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 4 : i) + a.dir));
      return { ...s, scale: ZOOMS[next] };
    }
    case 'ui/setStep':
      return { ...s, step: a.step };
    case 'ui/toggle': {
      const next = { ...s };
      next[a.key] = !s[a.key];
      return next;
    }
    case 'ui/setBgMode':
      return a.mode === null
        ? { ...s, bgMode: null, calib: [] }
        : { ...s, bgMode: a.mode, calib: [], tool: 'select', sel: null, draft: [], rectStart: null };
    case 'ui/toggleBgMode':
      return uiReducer(s, { type: 'ui/setBgMode', mode: s.bgMode === a.mode ? null : a.mode });
    case 'ui/calibClick':
      return { ...s, calib: s.calib.length >= 2 ? [a.pt] : [...s.calib, a.pt] };
    case 'ui/setCalibLen':
      return { ...s, calibLen: a.value };
    case 'ui/setDrawInput':
      return { ...s, drawInputs: { ...s.drawInputs, [a.key]: a.value } };
    case 'ui/notify':
      return { ...s, notice: a.notice };
    case 'ui/appendNotice':
      return { ...s, notice: s.notice ? { ...s.notice, msg: `${s.notice.msg} ${a.msg}` } : { msg: a.msg } };
  }
}
