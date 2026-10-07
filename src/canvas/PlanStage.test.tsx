import { render, screen } from '@testing-library/react';
import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { PlanStage } from './PlanStage';
import { buildStageModel } from './stageModel';

const noop = () => {};
const handlers = { onPointerDown: noop, onPointerMove: noop, onPointerUp: noop, onPointerLeave: noop, onDoubleClick: noop };

describe('PlanStage', () => {
  it('renders an accessible stage with labels, dimensions and patterns', () => {
    const { container } = render(<PlanStage model={buildStageModel(makeState({ plan: { shapes: samplePlan().shapes } }))} handlers={handlers} />);
    const stage = screen.getByRole('group', { name: 'Plan ogrodu' });
    expect(stage).toHaveStyle({ width: '840px', height: '616px' });
    expect(screen.getByText('Rabata bylinowa')).toBeInTheDocument();
    expect(screen.getByText('26,50 m')).toBeInTheDocument();
    expect(container.querySelectorAll('polygon')).toHaveLength(7);
    expect(container.querySelector('pattern#pat-grass')).not.toBeNull();
  });
});
