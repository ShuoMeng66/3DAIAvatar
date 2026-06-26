/**
 * CabinetPage — 2D 全息仓展示页（WebRTC 数字人）
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import CabinetSubtitle from '../components/cabinet/CabinetSubtitle';
import CabinetStage from '../components/cabinet/CabinetStage';
import CabinetBezel from '../components/cabinet/CabinetBezel';
import { CabinetScene } from '../components/cabinet/CabinetScene';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCabinetSync } from '../hooks/useCabinetSync';
import { BRAND } from '../config/brand';
import { API_BASE } from '../services/config';
import '../styles/cabinet.css';

const CONNECTION_CHECK_INTERVAL = 15000;

type CabinetMode = '3d' | '2d' | 'auto';

function getCabinetMode(): CabinetMode {
  const mode = import.meta.env.VITE_CABINET_MODE;
  if (mode === '3d' || mode === '2d' || mode === 'auto') return mode;
  return '2d';
}

function isKioskChromeHidden(): boolean {
  return import.meta.env.VITE_KIOSK_CHROME === 'false';
}

export default function CabinetPage() {
  const cabinetMode = getCabinetMode();
  const kioskMode = isKioskChromeHidden();
  const [connected, setConnected] = useState(false);

  const {
    subtitle: sseSubtitle,
    audioUrl,
    isSpeaking,
    isInterrupted,
    audioRef: sseAudioRef,
    linlyDriven,
  } = useCabinetSync();

  const sceneRef = useRef<CabinetScene | null>(null);
  const handleSceneReady = useCallback((scene: CabinetScene) => {
    sceneRef.current = scene;
  }, []);

  const mouthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (linlyDriven || !audioUrl || !sseAudioRef.current) return;
    const audio = sseAudioRef.current;
    audio.src = `${API_BASE}${audioUrl}`;
    audio.play().catch((err) => {
      console.warn('[CabinetPage] 音频播放失败:', err);
    });
  }, [audioUrl, sseAudioRef, linlyDriven]);

  useEffect(() => {
    if (cabinetMode === '2d' || linlyDriven) return;

    if (isSpeaking && sceneRef.current) {
      sceneRef.current.setMouthOpenness(0.8);
      mouthTimerRef.current = setInterval(() => {
        sceneRef.current?.setMouthOpenness(0.5 + Math.random() * 0.5);
      }, 150);
    } else if (sceneRef.current) {
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
      sceneRef.current.resetMouth();
    }

    return () => {
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
    };
  }, [isSpeaking, cabinetMode, linlyDriven]);

  useEffect(() => {
    if (isInterrupted && sceneRef.current) {
      sceneRef.current.resetMouth();
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
    }
  }, [isInterrupted]);

  const shouldUseWebRTC = cabinetMode === '2d' || cabinetMode === 'auto';
  const {
    videoRef,
    connectionState: webrtcState,
    connect: connectWebRTC,
  } = useWebRTC();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };
    check();
    const timer = setInterval(check, CONNECTION_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (shouldUseWebRTC) {
      connectWebRTC();
    }
  }, [shouldUseWebRTC, connectWebRTC]);

  const show3D = cabinetMode === '3d' || cabinetMode === 'auto';
  const showPiP = cabinetMode === 'auto' && webrtcState === 'connected' && show3D;
  const show2DFull =
    cabinetMode === '2d' ||
    (cabinetMode === 'auto' && webrtcState === 'connected' && !showPiP);
  const videoVisible = shouldUseWebRTC && (show2DFull || showPiP);

  return (
    <div className={`cabinet-page${kioskMode ? ' cabinet-page--kiosk' : ''}`}>
      {!kioskMode && (
        <header className="cabinet-header">
          <span className="cabinet-header-title">{BRAND.cabinetTitle}</span>
          <span className="cabinet-header-status">
            {connected && <span className="cabinet-header-status-dot" aria-hidden />}
            {connected ? '已连接' : '未连接'}
          </span>
        </header>
      )}

      <div className="cabinet-scene">
        <div className="cabinet-room-bg" />

        {show3D && <CabinetStage onSceneReady={handleSceneReady} />}

        <CabinetBezel showChrome={cabinetMode === '2d' || kioskMode} />

        {/* video 始终挂载，避免 ontrack 竞态 */}
        {shouldUseWebRTC && (
          <div
            className={
              showPiP
                ? 'cabinet-pip'
                : `cabinet-video-layer${
                    videoVisible ? '' : ' cabinet-video-layer--hidden'
                  }`
            }
          >
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
        )}

        {shouldUseWebRTC && webrtcState === 'failed' && cabinetMode === '2d' && (
          <div className="cabinet-error">
            <p>数字人连接失败</p>
            <p style={{ fontSize: '16px', marginTop: '8px' }}>
              请确认 Linly 已启动；远程部署需映射 UDP 8000
            </p>
          </div>
        )}
      </div>

      <CabinetSubtitle text={sseSubtitle} visible />

      {!linlyDriven && (
        <audio
          ref={sseAudioRef}
          style={{ display: 'none' }}
          onEnded={() => {
            sceneRef.current?.resetMouth();
          }}
        />
      )}
    </div>
  );
}
