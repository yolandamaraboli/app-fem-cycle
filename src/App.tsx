import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { DailyLog } from './pages/DailyLog';
import { History } from './pages/History';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { PWAUpdatePrompt } from './components/shared/PWAUpdatePrompt';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/log" element={<DailyLog />} />
          <Route path="/history" element={<History />} />
          <Route path="/insights/:cycleId" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <PWAUpdatePrompt />
    </HashRouter>
  );
}

export default App;
