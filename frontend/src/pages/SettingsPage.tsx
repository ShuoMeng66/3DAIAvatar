import { useState } from 'react';
import { Settings, Save, Trash2, Plus } from 'lucide-react';

const DEFAULT_PASSWORD = '123456';

interface Reminder {
  id: string;
  time: string;
  text: string;
}

export default function SettingsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [elderTitle, setElderTitle] = useState(() => localStorage.getItem('elder_title') || '奶奶');
  const [customTitle, setCustomTitle] = useState(() => localStorage.getItem('elder_custom_title') || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('reminders') || '[]');
    } catch { return []; }
  });
  const [personaText, setPersonaText] = useState(() => localStorage.getItem('llm_persona') || '');
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderText, setNewReminderText] = useState('');
  const [saved, setSaved] = useState(false);

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
    setTimeout(() => setSaved(false), 2000);
  };

  const addReminder = () => {
    if (!newReminderText.trim()) return;
    setReminders(prev => [...prev, {
      id: Date.now().toString(),
      time: newReminderTime,
      text: newReminderText
    }]);
    setNewReminderText('');
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <Settings size={48} className="text-warm-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">家属设置</h2>
        <p className="text-warm-text-light mb-6 text-lg">请输入密码进入设置</p>
        <input
          type="password"
          className="input-large mb-3 text-center"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="请输入密码"
          autoFocus
        />
        {passwordError && <p className="text-red-500 mb-2">{passwordError}</p>}
        <button className="btn-primary w-full" onClick={handleLogin}>进入设置</button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-4 py-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">家属设置</h2>
      
      {/* 老人称呼 */}
      <section>
        <h3 className="text-xl font-bold mb-2">老人称呼</h3>
        <div className="flex gap-3">
          <select
            className="input-large flex-1"
            value={elderTitle}
            onChange={e => setElderTitle(e.target.value)}
          >
            <option value="爷爷">爷爷</option>
            <option value="奶奶">奶奶</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        {elderTitle === 'custom' && (
          <input
            className="input-large mt-2"
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            placeholder="请输入自定义称呼"
          />
        )}
      </section>

      {/* 数字人形象上传 */}
      <section>
        <h3 className="text-xl font-bold mb-2">数字人形象</h3>
        <input
          type="file"
          accept="image/*"
          className="input-large"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) setAvatarPreview(URL.createObjectURL(file));
          }}
        />
        {avatarPreview && (
          <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border-2 border-warm-border">
            <img src={avatarPreview} alt="预览" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-warm-text-light text-base mt-1">上传清晰正面照片，用于生成数字人形象</p>
      </section>

      {/* 声音克隆 */}
      <section>
        <h3 className="text-xl font-bold mb-2">声音克隆</h3>
        <input
          type="file"
          accept="audio/*"
          className="input-large"
          onChange={e => setVoiceFile(e.target.files?.[0] || null)}
        />
        {voiceFile && <p className="text-green-600 text-base mt-1">已选择：{voiceFile.name}</p>}
        <p className="text-warm-text-light text-base mt-1">上传 1 分钟以上清晰语音，用于克隆声音</p>
      </section>

      {/* 提醒事项 */}
      <section>
        <h3 className="text-xl font-bold mb-2">提醒事项</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="time"
            className="input-large !w-32"
            value={newReminderTime}
            onChange={e => setNewReminderTime(e.target.value)}
          />
          <input
            className="input-large flex-1"
            value={newReminderText}
            onChange={e => setNewReminderText(e.target.value)}
            placeholder="如：该吃药了"
            onKeyDown={e => e.key === 'Enter' && addReminder()}
          />
          <button className="btn-primary !px-4" onClick={addReminder} aria-label="添加提醒">
            <Plus size={28} />
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
              <span className="font-bold text-warm-primary text-lg">{r.time}</span>
              <span className="flex-1 ml-3 text-lg">{r.text}</span>
              <button onClick={() => removeReminder(r.id)} className="text-red-400 p-1" aria-label="删除">
                <Trash2 size={24} />
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="text-warm-text-light text-center py-4">暂无提醒事项</p>
          )}
        </div>
      </section>

      {/* LLM 人设微调 */}
      <section>
        <h3 className="text-xl font-bold mb-2">对话风格微调</h3>
        <textarea
          className="input-large !h-32"
          value={personaText}
          onChange={e => setPersonaText(e.target.value)}
          placeholder="自定义小暖的说话风格，如：她喜欢用四川话聊天..."
        />
      </section>

      {/* 保存按钮 */}
      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleSave}>
        <Save size={28} />
        {saved ? '已保存' : '保存设置'}
      </button>
    </div>
  );
}