import { useState, useCallback, useEffect } from 'react';
import AvatarPlayer from '../components/AvatarPlayer';
import SubtitleBar from '../components/SubtitleBar';
import VoiceButton from '../components/VoiceButton';
import ChatHistory from '../components/ChatHistory';
import { useWebRTC } from '../hooks/useWebRTC';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useConversationState, STATE_LABELS } from '../hooks/useConversationState';
import { useVAD } from '../hooks/useVAD';
import { triggerInterrupt } from '../services/bargein';
import { chatText, uploadAudio } from '../services/api';
import { Send, Circle } from 'lucide-react';

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const [subtitle, setSubtitle] = useState('您好，我是小暖，有什么可以帮您的？');
  const [messages, setMessages] = useState<Array<{role: string; content: string; time: string}>>([
    { role: 'assistant', content: '您好，我是小暖，有什么可以帮您的？', time: new Date().toISOString() }
  ]);
  const [isRecording, setIsRecording] = useState(false);

  const convState = useConversationState();

  // 开发模式使用 WebRTC，生产模式用静态形象
  const { videoRef, connectionState } = useWebRTC();

  // VAD 语音活动检测（在 SPEAKING 状态下持续监听打断）
  const vad = useVAD({
    onSpeechStart: useCallback(() => {
      // 如果数字人正在说话，触发打断
      if (convState.isSpeaking) {
        handleInterrupt();
      }
    }, [convState.isSpeaking]),
    onSpeechEnd: useCallback(() => {
      // 语音结束，如果当前是 LISTENING 状态则开始处理
      if (convState.state === 'LISTENING') {
        convState.finishListening();
        setSubtitle('嗯，让我想想...');
      }
    }, [convState.state]),
  });

  // 空闲问候（30 秒）
  useIdleTimer(() => {
    if (convState.state === 'IDLE') {
      const greeting = '爷爷/奶奶，我在呢，想聊点什么？';
      setSubtitle(greeting);
      setMessages(prev => [...prev.slice(-4), { role: 'assistant', content: greeting, time: new Date().toISOString() }]);
    }
  }, 30000);

  // ========== 打断处理 ==========
  const handleInterrupt = useCallback(async () => {
    convState.interrupt();
    setSubtitle('好的，我听着呢');
    await triggerInterrupt();
    // 打断后立即切换到 LISTENING 状态
    convState.startListening();
    // 如果 VAD 未启动，启动它
    if (!vad.isSupported) {
      vad.start();
    }
  }, [convState, vad]);

  // ========== 文字发送 ==========
  const handleSendText = useCallback(async () => {
    if (!inputText.trim() || convState.isProcessing) return;

    // 添加用户消息
    const userMsg = { role: 'user' as const, content: inputText, time: new Date().toISOString() };
    setMessages(prev => [...prev.slice(-4), userMsg]);
    setInputText('');

    // 状态转换：IDLE → THINKING
    if (convState.state === 'IDLE') {
      convState.startListening();
      convState.finishListening();
    }
    setSubtitle('让我想想...');

    try {
      const res = await chatText(inputText, 'default');
      const reply = res.reply || '嗯，我听到了。';
      
      // 状态转换：THINKING → SPEAKING → IDLE
      convState.startSpeaking();
      setSubtitle(reply);
      setMessages(prev => [...prev.slice(-4), { role: 'assistant', content: reply, time: new Date().toISOString() }]);
      
      // 模拟播放完成后回到 IDLE
      setTimeout(() => {
        convState.finishSpeaking();
      }, reply.length * 100); // 按字数估算播放时间
    } catch {
      setSubtitle('抱歉，网络不太好，请再说一次。');
      convState.reset();
    }
  }, [inputText, convState]);

  // ========== 语音处理 ==========
  const handleVoiceToggle = useCallback(async (recording: boolean) => {
    setIsRecording(recording);
    if (recording) {
      // 如果正在 SPEAKING，先打断
      if (convState.isSpeaking) {
        await handleInterrupt();
      }
      convState.startListening();
      // 启动 VAD
      vad.start();
      setSubtitle('嗯，我听着呢...');
    } else {
      convState.finishListening();
      // 停止 VAD 监听
      vad.stop();
      setSubtitle('让我想想...');
    }
  }, [convState, vad, handleInterrupt]);

  const handleVoiceResult = useCallback(async (audioBlob: Blob) => {
    setSubtitle('正在听...');
    try {
      const res = await uploadAudio(audioBlob, 'default');
      const reply = res.reply || '我听到了您的声音。';
      
      convState.startSpeaking();
      setSubtitle(reply);
      setMessages(prev => [...prev.slice(-4), { role: 'assistant', content: reply, time: new Date().toISOString() }]);
      
      setTimeout(() => {
        convState.finishSpeaking();
      }, reply.length * 100);
    } catch {
      setSubtitle('抱歉，没听清楚，请再说一次。');
      convState.reset();
    }
  }, [convState]);

  // ========== 启动 VAD 持续监听 ==========
  useEffect(() => {
    // 页面加载后启动 VAD 持续监听
    if (vad.isSupported) {
      vad.start();
    }
    return () => {
      vad.stop();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 状态指示器 */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Circle
          size={12}
          className={
            convState.state === 'LISTENING' ? 'text-green-500 animate-pulse' :
            convState.state === 'SPEAKING' ? 'text-orange-500' :
            convState.state === 'THINKING' ? 'text-yellow-500 animate-pulse' :
            'text-gray-400'
          }
          fill="currentColor"
        />
        <span className="text-lg font-medium text-warm-text-light">
          {STATE_LABELS[convState.state]}
        </span>
      </div>

      {/* 数字人/形象区 60% */}
      <div className="flex-1 flex items-center justify-center bg-black rounded-2xl mx-4 mt-1 overflow-hidden" style={{ minHeight: '55%' }}>
        <AvatarPlayer videoRef={videoRef} connectionState={connectionState} />
      </div>
      
      {/* 字幕栏 */}
      <div className="px-4 py-2">
        <SubtitleBar text={subtitle} />
      </div>
      
      {/* 聊天历史（最近3条） */}
      <div className="px-4 py-1 flex-shrink-0" style={{ maxHeight: '80px' }}>
        <ChatHistory messages={messages.slice(-3)} />
      </div>
      
      {/* 底部操作栏 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border-t border-warm-border">
        {/* 文字输入 */}
        <div className="flex-1 flex gap-2">
          <input
            className="input-large flex-1"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder="打字聊天..."
            disabled={convState.isListening}
          />
          <button
            className={`btn-primary !px-4 ${convState.isProcessing ? 'opacity-50' : ''}`}
            onClick={handleSendText}
            disabled={convState.isProcessing}
            aria-label="发送"
          >
            <Send size={28} />
          </button>
        </div>
        
        {/* 语音按钮 */}
        <VoiceButton
          isRecording={isRecording}
          onToggle={handleVoiceToggle}
          onResult={handleVoiceResult}
        />
      </div>
    </div>
  );
}