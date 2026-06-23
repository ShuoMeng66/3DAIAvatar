import { MicOff } from 'lucide-react';

interface AvatarPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  connectionState: string;
}

export default function AvatarPlayer({ videoRef, connectionState }: AvatarPlayerProps) {
  const stateColors: Record<string, string> = {
    'new': 'text-gray-400',
    'connecting': 'text-warm-primary',
    'connected': 'text-green-500',
    'disconnected': 'text-red-400',
    'failed': 'text-red-500',
    'closed': 'text-gray-400',
  };

  const stateLabels: Record<string, string> = {
    'new': '未连接',
    'connecting': '连接中...',
    'connected': '已连接',
    'disconnected': '已断开',
    'failed': '连接失败',
    'closed': '已关闭',
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* 连接状态指示器 */}
      {connectionState !== 'connected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <MicOff size={64} className="text-white/60 mb-4" />
          <p className={`text-2xl font-bold ${stateColors[connectionState] || 'text-gray-400'}`}>
            {stateLabels[connectionState] || connectionState}
          </p>
          <p className="text-white/60 text-lg mt-2">数字人加载中...</p>
        </div>
      )}
    </div>
  );
}