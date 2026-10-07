import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { AppState } from '../state/rootReducer';
import { AppProvider, useAppState } from '../state/store';

export function renderWithStore(node: ReactElement, initial: AppState) {
  const ref = { current: initial };
  function Probe() {
    ref.current = useAppState();
    return null;
  }
  const user = userEvent.setup();
  const utils = render(
    <AppProvider initial={initial}>
      {node}
      <Probe />
    </AppProvider>,
  );
  return { ...utils, user, getState: () => ref.current };
}
