import type { MouseEventHandler, PointerEventHandler } from 'react';
import { color } from '../design/tokens';
import { cx } from '../ui/cx';
import s from './canvas.module.css';
import { Patterns } from './patterns';
import type { EdgeTone, HandleKind, StageModel } from './stageModel';

export interface StageHandlers {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
  onDoubleClick: MouseEventHandler<HTMLDivElement>;
}

const TONE: Record<EdgeTone, string> = { boundary: s.toneBoundary, selection: s.toneSelection, draft: s.toneDraft, calib: s.toneCalib };
const HANDLE: Record<HandleKind, string> = {
  vertex: s.hVertex, pointCenter: s.hPointCenter, draft: s.hDraft, draftFirst: s.hDraftFirst, draftClosable: s.hDraftClosable, calib: s.hCalib,
};
const NS = 'non-scaling-stroke';

export function PlanStage({ model: m, handlers }: { model: StageModel; handlers: StageHandlers }) {
  const major = 5 * m.scale, minor = m.scale;
  return (
    <div
      role="group"
      aria-label="Plan ogrodu"
      className={s.stage}
      style={{
        width: m.widthPx,
        height: m.heightPx,
        cursor: m.cursor,
        backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`,
      }}
      {...handlers}
    >
      {m.bg && (
        <img
          src={m.bg.src}
          alt=""
          draggable={false}
          className={s.bgImg}
          style={{ left: m.bg.left, top: m.bg.top, width: m.bg.width, height: m.bg.height, opacity: m.bg.opacity }}
        />
      )}
      {m.ticksX.map((t) => <span key={t.key} className={s.tickX} style={{ left: t.pos }}>{t.label}</span>)}
      {m.ticksY.map((t) => <span key={t.key} className={s.tickY} style={{ top: t.pos }}>{t.label}</span>)}

      <svg className={s.layer} viewBox={`0 0 ${m.W} ${m.H}`} preserveAspectRatio="none" aria-hidden="true">
        <Patterns />
        {m.polys.map((p) => (
          <polygon key={p.key} points={p.points} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} strokeLinejoin="round" vectorEffect={NS} />
        ))}
        {m.points.map((p) => (
          <g key={p.key}>
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke={p.stroke} strokeWidth={1.5} vectorEffect={NS} />
            {p.dotR > 0 && <circle cx={p.cx} cy={p.cy} r={p.dotR} fill={p.stroke} />}
          </g>
        ))}
        {m.bounds.map((p) => (
          <polygon key={p.key} points={p.points} fill="none" stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} strokeLinejoin="round" vectorEffect={NS} />
        ))}
        {m.selection?.kind === 'poly' && (
          <polygon points={m.selection.points} fill={color('selectionFill')} stroke={color('selection')} strokeWidth={2} vectorEffect={NS} />
        )}
        {m.selection?.kind === 'point' && (
          <circle cx={m.selection.cx} cy={m.selection.cy} r={m.selection.r} fill="none" stroke={color('selection')} strokeWidth={2} strokeDasharray="5 3" vectorEffect={NS} />
        )}
        {m.draftLine && (
          <polyline points={m.draftLine} fill={color('draftFill')} stroke={color('draft')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
        {m.draftRect && (
          <polygon points={m.draftRect} fill={color('draftRectFill')} stroke={color('draft')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
        {m.calibLine && (
          <polyline points={m.calibLine} fill="none" stroke={color('calib')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
      </svg>

      {m.labels.map((l) => (
        <div key={l.key} className={cx(s.label, l.anchor === 'center' ? s.labelCenter : s.labelCorner)} style={{ left: l.x, top: l.y }}>
          <div className={s.labelTitle}>{l.title}</div>
          <div className={s.labelSub}>{l.sub}</div>
        </div>
      ))}
      {m.edgeLabels.map((e) => (
        <span key={e.key} className={cx(s.edge, TONE[e.tone])} style={{ left: e.x, top: e.y }}>{e.text}</span>
      ))}
      {m.handles.map((h) => (
        <span key={h.key} className={cx(s.handle, HANDLE[h.kind])} style={{ left: h.x, top: h.y }} />
      ))}
    </div>
  );
}
