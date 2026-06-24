/**
 * HologramPage — 全息仓控制面板
 *
 * 左栏：控制端 /chat 预览
 * 右栏：展示端 /cabinet 预览（9:16 黑框）
 * 按钮：新窗口打开、复制副屏启动命令
 * 折叠区：高级 / LED 风扇模式（保留原有功能）
 */

import { useState } from 'react';

const KIOSK_COMMAND = `chrome.exe --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:5173/#/cabinet`;

export default function HologramPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toast, setToast] = useState('');

  const handleOpenCabinet = () => {
    window.open(
      '/#/cabinet',
      '_blank',
      'width=1440,height=2560',
    );
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
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#ccc' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#fff' }}>全息仓控制面板</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleOpenCabinet} style={btnStyle}>
            新窗口打开展示页
          </button>
          <button onClick={handleCopyCommand} style={btnStyle}>
            复制副屏启动命令
          </button>
        </div>
        {toast && (
          <span style={{ color: '#4ade80', fontSize: '13px' }}>{toast}</span>
        )}
      </div>

      {/* 双栏预览 */}
      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        {/* 左栏：控制端 */}
        <div style={{ flex: '3', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '6px' }}>
            控制端 /chat
          </div>
          <iframe
            src="/#/chat"
            style={{
              flex: 1,
              border: '1px solid #333',
              borderRadius: '8px',
              background: '#111',
            }}
            title="控制端预览"
          />
        </div>

        {/* 右栏：展示端（9:16 黑框） */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '6px' }}>
            展示端 /cabinet（9:16）
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            background: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #333',
          }}>
            <iframe
              src="/#/cabinet"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '100%',
                border: 'none',
                background: '#000',
              }}
              title="展示端预览"
            />
          </div>
        </div>
      </div>

      {/* 高级 / LED 风扇模式（折叠区） */}
      <div style={{ marginTop: '16px', flexShrink: 0 }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            ...btnStyle,
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
          }}
        >
          {showAdvanced ? '收起' : '展开'} 高级 / LED 风扇模式
        </button>

        {showAdvanced && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: '#111',
            borderRadius: '8px',
            border: '1px solid #333',
            fontSize: '14px',
            color: '#aaa',
            lineHeight: 1.8,
          }}>
            <p style={{ color: '#ff9800', margin: '0 0 8px' }}>
              以下为 LED 全息风扇屏功能（非全息仓），保留原有操作。
            </p>
            <p>
              LED 风扇屏使用 <code>hologram/converter.py</code> 生成 MP4，
              通过 TF 卡 / WiFi APP / RTSP 推流到 LED 风扇设备。
            </p>
            <p>
              全息仓（HDMI 直连显示器）不需要此模块，直接使用上方控制面板。
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>分辨率：512 / 1024</li>
              <li>格式：MP4 (H.264)，黑底 #000000</li>
              <li>推流：TF 卡 / WiFi APP / RTSP</li>
            </ul>
            <p style={{ color: '#888', fontSize: '12px' }}>
              详细说明见 <a href="https://github.com/ShuoMeng66/3DAIAvatar/blob/main/HOLOGRAM.md" style={{ color: '#64b5f6' }}>HOLOGRAM.md</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  whiteSpace: 'nowrap',
};