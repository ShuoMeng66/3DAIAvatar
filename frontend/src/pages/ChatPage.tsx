import { useState } from 'react';
import AvatarPlayer from '../components/AvatarPlayer';
import SubtitleBar from '../components/SubtitleBar';
import VoiceButton from '../components/VoiceButton';
import ChatHistory from '../components/ChatHistory';
import { useWebRTC } from '../hooks/useWebRTC';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { chatText, uploadAudio } from '../services/api';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const [subtitle, setSubtitle] = useState('您好，我是小暖，有什么可以帮您的？');
  const [messages, setMessages] = useState<Array<{role: string; content: string; time: string}>>([
    { role: 'assistant', content: '您好，我是小暖，有什么可以帮您的？', time: new Date().toISOString() }
  ]);
  const [isRecording, setIsRecording] = useState(false);

  const { videoRef, connectionState } = useWebRTC();
  useIdleTimer(() => {
    setSubtitle('爷爷/奶奶，我在呢，想聊点什么？');
  }, 30000);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const userMsg = { role: 'user', content: inputText, time: new Date().toISOString() };
    setMessages(prev => [...prev.slice(-4), userMsg]);
    setInputText('');
    
    try {
      const res = await chatText(inputText, 'default');
      const reply = res.reply || '嗯，我听到了。';
      setSubtitle(reply);
      setMessages(prev => [...prev.slice(-4), { role: 'assistant', content: reply, time: new Date().toISOString() }]);
    } catch {
      setSubtitle('抱歉，网络不太好，请再说一次。');
    }
  };

  const handleVoiceResult = async (audioBlob: Blob) => {
    try {
      const res = await uploadAudio(audioBlob, 'default');
      const reply = res.reply || '我听到了您的声音。';
      setSubtitle(reply);
      setMessages(prev => [...prev.slice(-4), { role: 'assistant', content: reply, time: new Date().toISOString() }]);
    } catch {
      setSubtitle('抱歉，没听清楚，请再说一次。');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 视频区 60% */}
      <div className="flex-1 flex items-center justify-center bg-black rounded-2xl mx-4 mt-2 overflow-hidden" style={{ minHeight: '60%' }}>
        <AvatarPlayer videoRef={videoRef} connectionState={connectionState} />
      </div>
      
      {/* 字幕栏 */}
      <div className="px-4 py-3">
        <SubtitleBar text={subtitle} />
      </div>
      
      {/* 聊天历史 */}
      <div className="px-4 py-2 flex-shrink-0" style={{ maxHeight: '120px' }}>
        <ChatHistory messages={messages} />
      </div>
      
      {/* 底部操作栏 */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white/80 backdrop-blur-sm border-t border-warm-border">
        {/* 文字输入 */}
        <div className="flex-1 flex gap-2">
          <input
            className="input-large flex-1"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder="打字聊天..."
          />
          <button className="btn-primary !px-4" onClick={handleSendText} aria-label="发送">
            <Send size={28} />
          </button>
        </div>
        
        {/* 语音按钮 */}
        <VoiceButton
          isRecording={isRecording}
          onToggle={(recording) => setIsRecording(recording)}
          onResult={handleVoiceResult}
        />
      </div>
    </div>
  );
}