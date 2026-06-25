import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import HologramPage from './pages/HologramPage';
import CabinetPage from './pages/CabinetPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/cabinet" element={<CabinetPage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="hologram" element={<HologramPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
