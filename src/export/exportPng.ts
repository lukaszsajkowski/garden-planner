import { pointStyle, polyStyle } from '../canvas/materialStyle';
import { canvasTokens, color, exportTokens, tokens } from '../design/tokens';
import { CATALOG, isPoly } from '../domain/catalog';
import { dateStamp, fmtArea, fmtLen } from '../domain/format';
import { area, bbox, centroid, dist } from '../domain/geometry';
import type { Plan, Pt } from '../domain/types';

export function exportScale(W: number, H: number): number {
  const p = exportTokens.pxPerMeter;
  return Math.max(p.min, Math.min(p.max, Math.floor(p.targetLongSidePx / Math.max(W, H))));
}

const gridMinor = tokens.color.grid.minor.value;
const gridMajor = tokens.color.grid.major.value.replace(/[\d.]+\)$/, `${exportTokens.gridMajorAlpha})`);
const [LABEL_MIN_W, LABEL_MIN_H] = canvasTokens.labelMinBoxPx;

export function drawPlan(g: CanvasRenderingContext2D, plan: Plan, img: HTMLImageElement | null, S: number, width: number, height: number, date: string = dateStamp()): void {
  const pad = exportTokens.margin;
  const { W, H, shapes, bg } = plan;
  const ink = color('text');

  const path = (pts: Pt[]) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0] * S, p[1] * S) : g.moveTo(p[0] * S, p[1] * S)));
    g.closePath();
  };
  const tag = (text: string, sub: string, x: number, y: number) => {
    g.font = exportTokens.fontLabel;
    const w1 = g.measureText(text).width;
    g.font = exportTokens.fontSub;
    const w2 = sub ? g.measureText(sub).width : 0;
    const w = Math.max(w1, w2) + 12, h = sub ? 36 : 20;
    g.fillStyle = color('labelBg');
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = exportTokens.fontLabel;
    g.fillText(text, x, sub ? y - 8 : y);
    if (sub) {
      g.font = exportTokens.fontSub;
      g.fillStyle = color('textSecondary');
      g.fillText(sub, x, y + 9);
    }
  };

  g.fillStyle = color('stage');
  g.fillRect(0, 0, width, height);
  g.save();
  g.translate(pad, pad);

  g.lineWidth = 1;
  for (let x = 0; x <= W; x++) {
    g.strokeStyle = x % 5 ? gridMinor : gridMajor;
    g.beginPath();
    g.moveTo(x * S + 0.5, 0);
    g.lineTo(x * S + 0.5, H * S);
    g.stroke();
  }
  for (let y = 0; y <= H; y++) {
    g.strokeStyle = y % 5 ? gridMinor : gridMajor;
    g.beginPath();
    g.moveTo(0, y * S + 0.5);
    g.lineTo(W * S, y * S + 0.5);
    g.stroke();
  }
  g.fillStyle = color('textMuted');
  g.font = '11px monospace';
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  for (let x = 0; x <= W; x += 5) g.fillText(String(x), x * S, -6);
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (let y = 0; y <= H; y += 5) g.fillText(String(y), -8, y * S);

  if (img && bg) {
    g.globalAlpha = bg.opacity;
    g.drawImage(img, bg.x * S, bg.y * S, bg.w * S, bg.w * bg.aspect * S);
    g.globalAlpha = 1;
  }

  const ordered = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[a.sh.type].z - CATALOG[b.sh.type].z || a.i - b.i)
    .map((o) => o.sh);
  g.lineJoin = 'round';
  for (const sh of ordered) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') continue;
      const st = polyStyle(sh.type);
      path(sh.pts);
      g.fillStyle = st.solid;
      g.fill();
      g.strokeStyle = st.stroke;
      g.lineWidth = st.sw;
      g.stroke();
    } else {
      const st = pointStyle(sh.type);
      g.beginPath();
      g.arc(sh.x * S, sh.y * S, sh.r * S, 0, Math.PI * 2);
      g.fillStyle = st.fill;
      g.fill();
      g.strokeStyle = st.stroke;
      g.lineWidth = 1.5;
      g.stroke();
    }
  }

  const bst = polyStyle('boundary');
  const dash = bst.dash.split(' ').map(Number);
  for (const sh of shapes) {
    if (!isPoly(sh) || sh.type !== 'boundary') continue;
    path(sh.pts);
    g.setLineDash(dash);
    g.strokeStyle = bst.stroke;
    g.lineWidth = bst.sw;
    g.stroke();
    g.setLineDash([]);
    for (let i = 0; i < sh.pts.length; i++) {
      const a = sh.pts[i], b = sh.pts[(i + 1) % sh.pts.length], len = dist(a, b);
      if (len * S < canvasTokens.edgeLabelMinPx) continue;
      g.font = '11px monospace';
      const txt = fmtLen(len), w = g.measureText(txt).width + 10;
      const mx = ((a[0] + b[0]) / 2) * S, my = ((a[1] + b[1]) / 2) * S;
      g.fillStyle = color('danger');
      g.fillRect(mx - w / 2, my - 9, w, 18);
      g.fillStyle = color('onAccent');
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(txt, mx, my);
    }
  }

  for (const sh of ordered) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') continue;
      const b = bbox(sh.pts);
      if ((b[2] - b[0]) * S < LABEL_MIN_W || (b[3] - b[1]) * S < LABEL_MIN_H) continue;
      const c = centroid(sh.pts);
      tag(sh.name || CATALOG[sh.type].label, fmtArea(area(sh.pts)), c[0] * S, c[1] * S);
    } else if (sh.name) {
      tag(sh.name, '', sh.x * S, sh.y * S);
    }
  }
  g.restore();

  let plot = 0;
  for (const sh of shapes) if (isPoly(sh) && sh.type === 'boundary') plot += area(sh.pts);
  const by = height - 26;
  g.fillStyle = ink;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = exportTokens.fontFooter;
  g.fillText('Plan ogrodu' + (plot ? ' · działka ' + fmtArea(plot) : '') + ' · ' + date, pad, by);
  const bar = exportTokens.scaleBarM * S, bx = width - pad - bar;
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(bx, by - 6);
  g.lineTo(bx, by + 2);
  g.lineTo(bx + bar, by + 2);
  g.lineTo(bx + bar, by - 6);
  g.stroke();
  g.font = exportTokens.fontSub;
  g.textAlign = 'right';
  g.fillText(`${exportTokens.scaleBarM} m`, bx - 8, by);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

export async function renderPlanPng(plan: Plan): Promise<Blob> {
  const S = exportScale(plan.W, plan.H), pad = exportTokens.margin;
  const c = document.createElement('canvas');
  c.width = Math.round(plan.W * S) + pad * 2;
  c.height = Math.round(plan.H * S) + pad * 2 + exportTokens.footerHeight;
  const g = c.getContext('2d');
  if (!g) throw new Error('Brak kontekstu 2D');
  const img = plan.bg && plan.bg.visible ? await loadImage(plan.bg.src) : null;
  drawPlan(g, plan, img, S, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}
