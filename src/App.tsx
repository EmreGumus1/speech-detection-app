import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import InferenceDashboardPage from './pages/InferenceDashboardPage';
import FileInferencePage from './pages/FileInferencePage';
import MicInferencePage from './pages/MicInferencePage';
import SystemAudioInferencePage from './pages/SystemAudioInferencePage';
import ModelsPage from './pages/ModelsPage';
import ExperimentsPage from './pages/ExperimentsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<InferenceDashboardPage />} />
        <Route path="inference" element={<InferenceDashboardPage />} />
        <Route path="inference/file" element={<FileInferencePage />} />
        <Route path="inference/mic" element={<MicInferencePage />} />
        <Route path="inference/system-audio" element={<SystemAudioInferencePage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}