import s from './App.module.css';
import { PlanView } from './canvas/PlanView';
import { AppProvider } from './state/store';
import { BackgroundPanel } from './ui/BackgroundPanel';
import { DrawPanel } from './ui/DrawPanel';
import { GridPanel } from './ui/GridPanel';
import { Header } from './ui/Header';
import { Notice } from './ui/Notice';
import { PlantPanel } from './ui/PlantPanel';
import { RightColumn } from './ui/RightColumn';
import { ToolsPanel } from './ui/ToolsPanel';

export function App() {
  return (
    <AppProvider>
      <div className={s.app}>
        <Header />
        <Notice />
        <main className={s.main}>
          <aside className={s.left}>
            <ToolsPanel />
            <DrawPanel />
            <PlantPanel />
            <BackgroundPanel />
            <GridPanel />
          </aside>
          <PlanView />
          <aside className={s.right}>
            <RightColumn />
          </aside>
        </main>
      </div>
    </AppProvider>
  );
}
