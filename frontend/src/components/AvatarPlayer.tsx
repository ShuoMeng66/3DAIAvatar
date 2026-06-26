import { MicOff } from 'lucide-react';

interface AvatarPlayerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  connectionState: string;
  iceState?: string;
  sessionId?: number | null;
  errorMessage?: string | null;
  simpleMode?: boolean;
  isSpeaking?: boolean;
  staticImageSrc?: string;
}

export default function AvatarPlayer({
  videoRef,
  connectionState,
  iceState,
  sessionId,
  errorMessage,
  simpleMode = false,
  isSpeaking = false,
  staticImageSrc = '/app-icon.png',
}: AvatarPlayerProps) {
  const stateColors: Record<string, string> = {
    idle: 'text-purple-accent',
    new: 'text-purple-accent',
    connecting: 'text-purple-light',
    waiting_stream: 'text-purple-light',
    connected: 'text-purple-success',
    disconnected: 'text-purple-error',
    failed: 'text-purple-error',
    closed: 'text-purple-accent',
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
    ready: '就绪',
  };

  const showOverlay = !simpleMode && connectionState !== 'connected';

  if (simpleMode) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-avatar-stage">
        <img
          src={staticImageSrc}
          alt="颐语"
          className={[
            'w-3/5 max-w-[280px] aspect-square object-cover rounded-3xl',
            isSpeaking ? 'animate-purple-glow animate-breathe' : '',
          ].join(' ')}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-avatar-stage">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/70">
          <MicOff size={64} className="text-purple-accent/60 mb-4" />
          <p
            className={`text-2xl font-bold ${stateColors[connectionState] || 'text-purple-accent'}`}
          >
            {stateLabels[connectionState] || connectionState}
          </p>
          {connectionState === 'idle' && (
            <p className="text-purple-accent text-lg mt-2">等待连接...</p>
          )}
          {connectionState === 'connecting' && (
            <p className="text-purple-accent text-lg mt-2">正在建立连接...</p>
          )}
          {connectionState === 'waiting_stream' && (
            <p className="text-purple-accent text-lg mt-2 text-center px-4">
              信令已完成，等待数字人视频流
            </p>
          )}
          {connectionState === 'failed' && (
            <p className="text-purple-accent text-lg mt-2 text-center px-4">
              {errorMessage ?? '请确认 Linly 服务已启动'}
            </p>
          )}
          {connectionState === 'waiting_stream' &&
            (iceState === 'checking' || iceState === 'new') && (
              <p className="text-purple-accent/80 text-sm mt-2 text-center px-4">
                远程部署需 AutoDL 8000 端口 UDP 公网映射
              </p>
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
