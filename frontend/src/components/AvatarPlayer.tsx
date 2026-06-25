import { MicOff } from 'lucide-react';

interface AvatarPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  connectionState: string;
  iceState?: string;
  sessionId?: number | null;
}

export default function AvatarPlayer({
  videoRef,
  connectionState,
  iceState,
  sessionId,
}: AvatarPlayerProps) {
  const stateColors: Record<string, string> = {
    idle: 'text-gray-400',
    new: 'text-gray-400',
    connecting: 'text-warm-primary',
    waiting_stream: 'text-warm-primary',
    connected: 'text-green-500',
    disconnected: 'text-red-400',
    failed: 'text-red-500',
    closed: 'text-gray-400',
  };

  const stateLabels: Record<string, string> = {
    idle: '未连接',
    new: '未连接',
    connecting: '连接中...',
    waiting_stream: '等待视频帧...',
    connected: '已连接',
    disconnected: '已断开',
    failed: '连接失败，请检查 Linly 服务',
    closed: '已关闭',
  };

  const showOverlay = connectionState !== 'connected';

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <MicOff size={64} className="text-white/60 mb-4" />
          <p
            className={`text-2xl font-bold ${stateColors[connectionState] || 'text-gray-400'}`}
          >
            {stateLabels[connectionState] || connectionState}
          </p>
          {connectionState === 'idle' && (
            <p className="text-white/60 text-lg mt-2">等待连接...</p>
          )}
          {connectionState === 'connecting' && (
            <p className="text-white/60 text-lg mt-2">正在建立连接...</p>
          )}
          {connectionState === 'waiting_stream' && (
            <p className="text-white/60 text-lg mt-2">
              信令已完成，等待数字人视频流（远程部署需 UDP 8000 可达）
            </p>
          )}
          {connectionState === 'failed' && (
            <p className="text-white/60 text-lg mt-2">请确认 Linly 服务已启动</p>
          )}
        </div>
      )}

      {import.meta.env.DEV && (iceState || sessionId != null) && (
        <div className="absolute bottom-2 left-2 text-xs text-white/40 font-mono">
          {sessionId != null && <span>session {sessionId} </span>}
          {iceState && <span>ICE: {iceState}</span>}
        </div>
      )}
    </div>
  );
}
