import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import InferencePage from './pages/InferencePage';

function PlaceholderPage({ title }: { title: string }) {
  return <div style={{ padding: 24, fontSize: 28 }}>{title}</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<InferencePage />} />
        <Route path="models" element={<PlaceholderPage title="Models" />} />
        <Route path="experiments" element={<PlaceholderPage title="Experiments" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
    </Routes>
  );
}