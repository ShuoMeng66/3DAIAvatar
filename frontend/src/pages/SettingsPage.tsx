import { useState, useEffect } from 'react';
import { Settings, Save, Trash2, Plus, Wifi } from 'lucide-react';
import { healthCheckFull } from '../services/api';
import { Button, Card, Input } from '../components/ui';
import ConnectionStatus from '../components/ConnectionStatus';

const DEFAULT_PASSWORD = '123456';

interface Reminder {
  id: string;
  time: string;
  text: string;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-6 bg-purple-primary rounded-full flex-shrink-0" />
        <h3 className="text-xl font-bold text-purple-text">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [elderTitle, setElderTitle] = useState(
    () => localStorage.getItem('elder_title') || '奶奶',
  );
  const [customTitle, setCustomTitle] = useState(
    () => localStorage.getItem('elder_custom_title') || '',
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('reminders') || '[]');
    } catch {
      return [];
    }
  });
  const [personaText, setPersonaText] = useState(
    () => localStorage.getItem('llm_persona') || '',
  );
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderText, setNewReminderText] = useState('');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [health, setHealth] = useState<{ backend: boolean; linly: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (authenticated) {
      healthCheckFull().then(setHealth);
    }
  }, [authenticated]);

  const runConnectionTest = async () => {
    const h = await healthCheckFull();
    setHealth(h);
    setToast('连接测试完成');
    setTimeout(() => setToast(''), 2000);
  };

  const handleLogin = () => {
    if (password === DEFAULT_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('密码错误');
    }
  };

  const handleSave = () => {
    localStorage.setItem('elder_title', elderTitle);
    localStorage.setItem('elder_custom_title', customTitle);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('llm_persona', personaText);
    setSaved(true);
    setToast('设置已保存');
    setTimeout(() => {
      setSaved(false);
      setToast('');
    }, 2000);
  };

  const addReminder = () => {
    if (!newReminderText.trim()) return;
    setReminders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: newReminderTime,
        text: newReminderText,
      },
    ]);
    setNewReminderText('');
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <Card className="w-full max-w-md overflow-hidden !p-0">
          <div className="h-1 gradient-purple" />
          <div className="p-6">
            <Settings size={48} className="text-purple-primary mb-4 mx-auto block" />
            <h2 className="text-2xl font-bold mb-2 text-center text-purple-text">
              家属设置
            </h2>
            <p className="text-purple-text-muted mb-6 text-lg text-center">
              请输入密码进入设置
            </p>
            <Input
              type="password"
              className="mb-3 text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="请输入密码"
              autoFocus
            />
            {passwordError && (
              <p className="text-purple-error mb-2 text-center">{passwordError}</p>
            )}
            <Button variant="primary" fullWidth onClick={handleLogin}>
              进入设置
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-4 py-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-center text-purple-text">家属设置</h2>
      {toast && (
        <div className="text-center py-2 px-4 rounded-xl bg-purple-accent/50 text-purple-text text-lg">
          {toast}
        </div>
      )}

      <SectionCard title="老人称呼">
        <select
          className="input-large w-full"
          value={elderTitle}
          onChange={(e) => setElderTitle(e.target.value)}
        >
          <option value="爷爷">爷爷</option>
          <option value="奶奶">奶奶</option>
          <option value="custom">自定义</option>
        </select>
        {elderTitle === 'custom' && (
          <input
            className="input-large mt-2 w-full"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="请输入自定义称呼"
          />
        )}
      </SectionCard>

      <SectionCard title="数字人形象">
        <input
          type="file"
          accept="image/*"
          className="input-large w-full"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setAvatarPreview(URL.createObjectURL(file));
          }}
        />
        {avatarPreview && (
          <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border-2 border-purple-border">
            <img src={avatarPreview} alt="预览" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-purple-text-muted text-base mt-2">
          上传清晰正面照片，用于生成数字人形象
        </p>
      </SectionCard>

      <SectionCard title="声音克隆">
        <input
          type="file"
          accept="audio/*"
          className="input-large w-full"
          onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
        />
        {voiceFile && (
          <p className="text-purple-success text-base mt-2">已选择：{voiceFile.name}</p>
        )}
        <p className="text-purple-text-muted text-base mt-2">
          上传 1 分钟以上清晰语音，用于克隆声音
        </p>
      </SectionCard>

      <SectionCard title="提醒事项">
        <div className="flex gap-2 mb-2 flex-wrap">
          <input
            type="time"
            className="input-large !w-32"
            value={newReminderTime}
            onChange={(e) => setNewReminderTime(e.target.value)}
          />
          <input
            className="input-large flex-1 min-w-[120px]"
            value={newReminderText}
            onChange={(e) => setNewReminderText(e.target.value)}
            placeholder="如：该吃药了"
            onKeyDown={(e) => e.key === 'Enter' && addReminder()}
          />
          <Button className="!px-4 !min-w-[64px]" onClick={addReminder} aria-label="添加提醒">
            <Plus size={28} />
          </Button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-purple-bg rounded-xl px-4 py-3 border border-purple-border"
            >
              <span className="font-bold text-purple-primary text-lg">{r.time}</span>
              <span className="flex-1 ml-3 text-lg text-purple-text">{r.text}</span>
              <button
                type="button"
                onClick={() => removeReminder(r.id)}
                className="text-purple-error p-1"
                aria-label="删除"
              >
                <Trash2 size={24} />
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="text-purple-text-muted text-center py-4">暂无提醒事项</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="对话风格微调">
        <textarea
          className="input-large !h-32 w-full resize-none"
          value={personaText}
          onChange={(e) => setPersonaText(e.target.value)}
          placeholder="自定义颐语的说话风格，如：喜欢用四川话聊天..."
        />
      </SectionCard>

      <SectionCard title="连接测试">
        {health && <ConnectionStatus backend={health.backend} linly={health.linly} />}
        <Button
          variant="secondary"
          fullWidth
          className="mt-3 flex items-center justify-center gap-2"
          onClick={runConnectionTest}
        >
          <Wifi size={24} />
          测试 API / Linly
        </Button>
      </SectionCard>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-10">
        <Button
          variant="primary"
          fullWidth
          className="flex items-center justify-center gap-2 shadow-lg"
          onClick={handleSave}
        >
          <Save size={28} />
          {saved ? '已保存' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
