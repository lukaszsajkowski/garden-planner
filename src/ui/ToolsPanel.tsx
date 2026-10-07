import { pointStyle, polyStyle } from '../canvas/materialStyle';
import { CATALOG, ORDER_POINT, ORDER_POLY, isPolyType } from '../domain/catalog';
import type { ReactElement } from 'react';
import type { ShapeType } from '../domain/types';
import type { Tool } from '../state/uiReducer';
import { useAppDispatch, useAppState } from '../state/store';
import { CursorIcon } from './icons';
import s from './panels.module.css';
import { GroupTitle, Panel } from './primitives/layout';

function Swatch({ type }: { type: ShapeType }) {
  let fill: string, stroke: string, dash = 'none', rx = 0.45;
  if (isPolyType(type)) {
    const st = polyStyle(type);
    fill = st.fill;
    stroke = st.stroke;
    dash = st.toolDash;
    rx = 0.08;
  } else {
    const st = pointStyle(type);
    fill = st.fill;
    stroke = st.stroke;
  }
  return (
    <svg width={22} height={22} viewBox="0 0 1 1" aria-hidden="true">
      <rect x={0.05} y={0.05} width={0.9} height={0.9} rx={rx} fill={fill} stroke={stroke} strokeWidth={1.5} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ToolsPanel() {
  const { ui } = useAppState();
  const dispatch = useAppDispatch();
  const btn = (tool: Tool, icon: ReactElement, label: string) => (
    <button key={tool} type="button" className={s.toolBtn} aria-pressed={ui.tool === tool} onClick={() => dispatch({ type: 'ui/setTool', tool })}>
      {icon}
      {label}
    </button>
  );
  return (
    <Panel title="Narzędzia">
      <div className={s.stack6}>
        {btn('select', <CursorIcon />, 'Zaznacz i przesuń')}
        <GroupTitle>Obszary</GroupTitle>
        {ORDER_POLY.map((t) => btn(t, <Swatch type={t} />, CATALOG[t].label))}
        <GroupTitle>Rośliny</GroupTitle>
        {ORDER_POINT.map((t) => btn(t, <Swatch type={t} />, CATALOG[t].label))}
      </div>
    </Panel>
  );
}
