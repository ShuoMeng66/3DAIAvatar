import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import HologramPage from './pages/HologramPage';
import CabinetPage from './pages/CabinetPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 全息仓展示页：独立路由，不使用 Layout（无导航、无按钮） */}
        <Route path="/cabinet" element={<CabinetPage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="hologram" element={<HologramPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}