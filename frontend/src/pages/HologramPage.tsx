import { useState } from 'react';
import { Monitor, Send } from 'lucide-react';

export default function HologramPage() {
  const [status, setStatus] = useState<'ready' | 'generating' | 'done'>('ready');

  const handlePush = () => {
    setStatus('generating');
    setTimeout(() => setStatus('done'), 2000);
  };

  const statusText = {
    ready: '就绪',
    generating: '生成中...',
    done: '推送成功',
  };

  const statusColor = {
    ready: 'text-warm-text-light',
    generating: 'text-warm-primary',
    done: 'text-green-600',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-6">
      <Monitor size={48} className="text-warm-primary" />
      <h2 className="text-2xl font-bold">全息屏预览</h2>
      
      {/* 黑底正方形预览区 */}
      <div className="w-64 h-64 sm:w-80 sm:h-80 bg-black rounded-2xl flex items-center justify-center border-2 border-warm-border">
        <p className="text-gray-500 text-center px-4">
          全息视频预览区<br />
          <span className="text-base">512×512 黑底正方形</span>
        </p>
      </div>

      <p className={`text-xl font-bold ${statusColor[status]}`}>
        {statusText[status]}
      </p>

      <button
        className="btn-primary flex items-center gap-2"
        onClick={handlePush}
        disabled={status === 'generating'}
      >
        <Send size={28} />
        推送到全息屏
      </button>

      <p className="text-warm-text-light text-base text-center">
        将数字人视频推送到 3D LED 全息风扇屏<br />
        支持 WiFi APP / 局域网 CMS / RTSP 流
      </p>
    </div>
  );
}