import { useNavigate } from 'react-router-dom';
import { BRAND } from '../config/brand';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full px-6 py-8 justify-center">
      <p className="text-sm uppercase tracking-widest text-warm-text-light mb-2">
        {BRAND.nameEn}
      </p>
      <h1 className="text-4xl font-black text-warm-primary mb-3">{BRAND.nameZh}</h1>
      <p className="text-xl text-warm-text mb-8 leading-relaxed">{BRAND.tagline}</p>

      <ul className="space-y-3 text-lg text-warm-text-light mb-10">
        <li>· 动态数字人 WebRTC 实时陪聊</li>
        <li>· 2D 全息仓竖屏展示</li>
        <li>· 语音打断与字幕同步</li>
      </ul>

      <button
        type="button"
        className="btn-primary w-full text-xl py-4 mb-3"
        onClick={() => navigate('/chat')}
      >
        开始体验
      </button>
      <button
        type="button"
        className="w-full py-3 text-lg text-warm-primary border border-warm-primary rounded-xl"
        onClick={() => navigate('/hologram')}
      >
        全息仓部署
      </button>
    </div>
  );
}
