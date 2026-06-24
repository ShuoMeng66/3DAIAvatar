/**
 * CabinetPage — 全息仓展示页
 *
 * 竖屏 9:16 2K（1440×2560），HDMI 直连第二显示器。
 * 背景纯黑 #000000，无 UI 控件、无导航、无按钮。
 *
 * 通过 SSE 与控制端 /chat 同步：字幕、TTS 音频、口型动画。
 *
 * 模式（VITE_CABINET_MODE）：
 * - 3d: 仅 3D 场景
 * - 2d: 仅 2D WebRTC 视频
 * - auto: 3D 默认显示，WebRTC 成功时 PiP 叠加
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import CabinetSubtitle from '../components/cabinet/CabinetSubtitle';
import CabinetStage from '../components/cabinet/CabinetStage';
import { CabinetScene } from '../components/cabinet/CabinetScene';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCabinetSync } from '../hooks/useCabinetSync';
import '../styles/cabinet.css';

const CONNECTION_CHECK_INTERVAL = 15000;

type CabinetMode = '3d' | '2d' | 'auto';

function getCabinetMode(): CabinetMode {
  const mode = import.meta.env.VITE_CABINET_MODE;
  if (mode === '3d' || mode === '2d' || mode === 'auto') return mode;
  return 'auto';
}

export default function CabinetPage() {
  const cabinetMode = getCabinetMode();
  const [connected, setConnected] = useState(false);

  // SSE 同步：字幕、音频、口型
  const {
    subtitle: sseSubtitle,
    audioUrl,
    isSpeaking,
    isInterrupted,
    audioRef: sseAudioRef,
  } = useCabinetSync();

  // 3D 场景引用（用于口型控制）
  const sceneRef = useRef<CabinetScene | null>(null);
  const handleSceneReady = useCallback((scene: CabinetScene) => {
    sceneRef.current = scene;
  }, []);

  // 口型动画循环
  const mouthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 音频播放：audioUrl 变化时自动播放
  useEffect(() => {
    if (audioUrl && sseAudioRef.current) {
      const audio = sseAudioRef.current;
      audio.src = `http://localhost:8010${audioUrl}`;
      audio.play().catch((err) => {
        console.warn('[CabinetPage] 音频播放失败:', err);
      });
    }
  }, [audioUrl, sseAudioRef]);

  useEffect(() => {
    if (isSpeaking && sceneRef.current) {
      // 启动口型动画
      sceneRef.current.setMouthOpenness(0.8);
      mouthTimerRef.current = setInterval(() => {
        sceneRef.current?.setMouthOpenness(0.5 + Math.random() * 0.5);
      }, 150);
    } else if (sceneRef.current) {
      // 停止口型动画
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
  }, [isSpeaking]);

  // 打断时重置口型
  useEffect(() => {
    if (isInterrupted && sceneRef.current) {
      sceneRef.current.resetMouth();
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
    }
  }, [isInterrupted]);

  // WebRTC（仅在 2d 或 auto 模式下启动）
  const shouldUseWebRTC = cabinetMode === '2d' || cabinetMode === 'auto';
  const {
    videoRef,
    connectionState: webrtcState,
    connect: connectWebRTC,
  } = useWebRTC();

  // 健康检查
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8010/api/v1/health');
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };
    check();
    const timer = setInterval(check, CONNECTION_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // 启动 WebRTC 连接
  useEffect(() => {
    if (shouldUseWebRTC) {
      connectWebRTC();
    }
  }, [shouldUseWebRTC, connectWebRTC]);

  const show3D = cabinetMode === '3d' || cabinetMode === 'auto';
  const show2D = cabinetMode === '2d' || (cabinetMode === 'auto' && webrtcState === 'connected');
  const showPiP = cabinetMode === 'auto' && webrtcState === 'connected' && show3D;

  return (
    <div className="cabinet-page">
      {/* 顶部 8%：标题 + 连接状态 */}
      <header className="cabinet-header">
        <span className="cabinet-header-title">小暖陪聊</span>
        <span className="cabinet-header-status">
          {connected ? '已连接' : '未连接'}
        </span>
      </header>

      {/* 中间 72%：3D 场景 / 2D 视频 */}
      <div className="cabinet-scene">
        {/* 3D 场景 */}
        {show3D && <CabinetStage onSceneReady={handleSceneReady} />}

        {/* 2D 视频层（全屏模式） */}
        {show2D && !showPiP && (
          <div className="cabinet-video-layer">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* PiP 小窗 */}
        {showPiP && (
          <div className="cabinet-pip">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* 连接失败提示 */}
        {shouldUseWebRTC && webrtcState === 'failed' && cabinetMode === '2d' && (
          <div className="cabinet-error">
            <p>数字人连接失败</p>
            <p style={{ fontSize: '16px', marginTop: '8px' }}>
              请确认 Linly-Talker-Stream 已启动
            </p>
          </div>
        )}
      </div>

      {/* 底部 20%：字幕（SSE 实时驱动） */}
      <CabinetSubtitle text={sseSubtitle} visible={true} />

      {/* 隐藏的音频元素（SSE 驱动播放） */}
      <audio
        ref={sseAudioRef}
        style={{ display: 'none' }}
        onEnded={() => {
          sceneRef.current?.resetMouth();
        }}
      />
    </div>
  );
}