import { Button, Card, Badge, Input } from '../components/ui';

export default function UiPreviewPage() {
  return (
    <div className="min-h-full px-4 py-6 pb-8 space-y-8">
      <h1 className="text-3xl font-black text-purple-text">UI 组件预览</h1>
      <p className="text-purple-text-muted text-lg">Purple Elder Companion 设计系统</p>

      <section>
        <h2 className="text-xl font-bold text-purple-text mb-4">Button</h2>
        <div className="space-y-3">
          <Button variant="primary" fullWidth>
            主按钮 Primary
          </Button>
          <Button variant="secondary" fullWidth>
            次按钮 Secondary
          </Button>
          <Button variant="outline" fullWidth>
            描边 Outline
          </Button>
          <Button variant="ghost" fullWidth>
            幽灵 Ghost
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-purple-text mb-4">Card</h2>
        <Card>
          <p className="text-lg text-purple-text">卡片内容示例，白底紫边轻阴影。</p>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-purple-text mb-4">Badge</h2>
        <div className="flex flex-wrap gap-4">
          <Badge status="online" label="API 正常" />
          <Badge status="offline" label="Linly 离线" />
          <Badge status="connecting" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-purple-text mb-4">Input</h2>
        <Input label="示例输入" placeholder="请输入..." />
      </section>

      <section>
        <h2 className="text-xl font-bold text-purple-text mb-4">装饰</h2>
        <div className="h-16 rounded-2xl gradient-purple" />
        <div className="mt-3 p-4 glass-panel rounded-2xl text-purple-text">
          Glass Panel 玻璃面板
        </div>
      </section>
    </div>
  );
}
