/**
 * HologramPage — 全息仓控制面板 + AutoDL 部署向导
 */

import { useEffect, useState } from 'react';
import { healthCheckFull } from '../services/api';
import { BRAND } from '../config/brand';
import '../styles/hologram.css';

const KIOSK_COMMAND = `chrome.exe --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:5173/#/cabinet`;

const DEPLOY_STEPS = [
  'AutoDL 选 PyTorch 2.1 + Python 3.10，映射端口 8000/8010/5173',
  '安装 Linly：third_party/Linly-Talker-Stream/scripts/setup-env.sh',
  '配置 .env：LLM_API_KEY、LINLY_STREAM_URL=http://127.0.0.1:8000',
  '启动 Linly → backend → frontend（见 docs/deploy/autodl.md）',
  '运行 scripts/check_webrtc.sh 验证信令与 UDP',
  '副屏 Chrome kiosk 打开 /#/cabinet（VITE_CABINET_MODE=2d）',
];

export default function HologramPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toast, setToast] = useState('');
  const [health, setHealth] = useState<{ backend: boolean; linly: boolean } | null>(
    null,
  );

  useEffect(() => {
    healthCheckFull().then(setHealth);
    const t = setInterval(() => healthCheckFull().then(setHealth), 15000);
    return () => clearInterval(t);
  }, []);

  const handleOpenCabinet = () => {
    window.open('/#/cabinet', '_blank', 'width=1440,height=2560');
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(KIOSK_COMMAND);
      setToast('已复制副屏启动命令');
    } catch {
      setToast('复制失败，请手动复制');
    }
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="hologram-page">
      <header className="hologram-header">
        <h1>{BRAND.nameZh} 全息仓</h1>
        {toast && <span className="hologram-toast">{toast}</span>}
      </header>

      {health && (
        <div className="hologram-status">
          <span className={health.backend ? 'ok' : 'err'}>
            API {health.backend ? '正常' : '离线'}
          </span>
          <span className={health.linly ? 'ok' : 'err'}>
            Linly {health.linly ? '正常' : '离线'}
          </span>
        </div>
      )}

      <section className="hologram-wizard">
        <h2>AutoDL 部署步骤</h2>
        <ol>
          {DEPLOY_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="hologram-note">
          offer 200 无画面 = 信令 OK、UDP 未通。详见 docs/deploy/autodl.md
        </p>
      </section>

      <div className="hologram-actions">
        <button type="button" onClick={handleOpenCabinet}>
          新窗口打开展示页
        </button>
        <button type="button" onClick={handleCopyCommand}>
          复制副屏启动命令
        </button>
      </div>

      <div className="hologram-preview">
        <div className="hologram-preview-col">
          <span>控制端 /chat</span>
          <iframe src="/#/chat" title="控制端预览" />
        </div>
        <div className="hologram-preview-col hologram-preview-col--cabinet">
          <span>展示端 /cabinet</span>
          <iframe src="/#/cabinet" title="展示端预览" />
        </div>
      </div>

      <button
        type="button"
        className="hologram-advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '收起' : '高级 / LED 风扇模式'}
      </button>

      {showAdvanced && (
        <div className="hologram-advanced">
          <p>LED 风扇全息模式请见 HOLOGRAM.md；2D 全息仓推荐使用 WebRTC 2d 模式。</p>
        </div>
      )}
    </div>
  );
}
