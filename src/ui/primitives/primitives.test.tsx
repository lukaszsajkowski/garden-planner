import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FileButton } from './Button';
import { Segmented, Toggle } from './controls';
import { NumberField } from './fields';
import { Panel } from './layout';

function Harness({ onBegin = () => {} }: { onBegin?: () => void }) {
  const [v, setV] = useState(2.5);
  return (
    <>
      <NumberField label="Szerokość (m)" value={v} onValue={setV} onBeginEdit={onBegin} />
      <output>{v}</output>
    </>
  );
}

describe('NumberField', () => {
  it('shows the value with a decimal comma and accepts comma input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Szerokość (m)');
    expect(input).toHaveValue('2,5');
    await user.clear(input);
    await user.type(input, '3,75');
    expect(screen.getByRole('status')).toHaveTextContent('3.75');
  });

  it('ignores text that is not a number and restores the value on blur', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Szerokość (m)');
    await user.clear(input);
    await user.type(input, '12.5 m');
    expect(screen.getByRole('status')).toHaveTextContent('12.5');
    await user.clear(input);
    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
    await user.tab();
    expect(input).toHaveValue('12,5');
  });

  it('calls onBeginEdit on focus', async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    render(<Harness onBegin={onBegin} />);
    await user.click(screen.getByLabelText('Szerokość (m)'));
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it('hideLabel uses aria-label instead of a visible label', () => {
    render(<NumberField label="Punkt 1 X" value={1} onValue={() => {}} hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Punkt 1 X' })).toBeInTheDocument();
    expect(screen.queryByText('Punkt 1 X')).toBeNull();
  });
});

describe('FileButton', () => {
  it('passes the chosen file and resets the input', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<FileButton label="Otwórz plik" accept=".json" onFile={onFile} />);
    const input = screen.getByLabelText('Otwórz plik') as HTMLInputElement;
    const file = new File(['{}'], 'plan.json', { type: 'application/json' });
    await user.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });
});

describe('Toggle and Segmented', () => {
  it('Toggle exposes aria-pressed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Toggle pressed label="Wymiary granicy działki" onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: 'Wymiary granicy działki' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await user.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });

  it('Segmented marks the current option and reports changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented options={[{ value: 1, label: '1 m' }, { value: 0.5, label: '0,5 m' }]} value={0.5} onChange={onChange} columns={2} />);
    expect(screen.getByRole('button', { name: '0,5 m' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 m' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: '1 m' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('Panel', () => {
  it('is a named region with a heading', () => {
    render(<Panel title="Narzędzia"><p>x</p></Panel>);
    expect(screen.getByRole('region', { name: 'Narzędzia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Narzędzia' })).toBeInTheDocument();
  });
});
