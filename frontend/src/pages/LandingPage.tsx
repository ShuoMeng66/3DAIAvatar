import { useNavigate } from 'react-router-dom';
import { MessageCircle, Monitor, Sparkles } from 'lucide-react';
import { BRAND } from '../config/brand';
import { Button, Card } from '../components/ui';

const FEATURES = [
  { icon: MessageCircle, title: '语音陪聊', desc: '按住说话，自然对话' },
  { icon: Monitor, title: '全息展示', desc: '2D 竖屏全息仓模式' },
  { icon: Sparkles, title: '温暖智伴', desc: '大字幕、大按钮、易上手' },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col h-full px-6 py-8 justify-center overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-purple-400/20 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-20 -left-16 w-56 h-56 rounded-full bg-fuchsia-300/15 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/3 right-0 w-32 h-32 rounded-full bg-purple-light/20 blur-2xl pointer-events-none"
        aria-hidden
      />

      <p className="text-sm uppercase tracking-widest text-purple-text-muted mb-2 relative z-10">
        {BRAND.nameEn}
      </p>
      <h1 className="text-4xl font-black text-purple-primary mb-3 relative z-10">
        {BRAND.nameZh}
      </h1>
      <p className="text-xl text-purple-text mb-8 leading-relaxed relative z-10">
        {BRAND.tagline}
      </p>

      <div className="space-y-3 mb-10 relative z-10">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <Card key={title} padding="sm" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-accent/40 flex items-center justify-center flex-shrink-0">
              <Icon size={28} className="text-purple-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-text">{title}</p>
              <p className="text-base text-purple-text-muted">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="relative z-10 space-y-3">
        <Button variant="primary" fullWidth onClick={() => navigate('/chat')}>
          开始聊天
        </Button>
        <Button variant="outline" fullWidth onClick={() => navigate('/hologram')}>
          全息仓部署
        </Button>
      </div>
    </div>
  );
}
