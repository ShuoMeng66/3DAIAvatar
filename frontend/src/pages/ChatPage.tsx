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
import { chatText, uploadAudio, healthCheckFull } from '../services/api';
import { BRAND } from '../config/brand';
import { Send, Circle, RefreshCw } from 'lucide-react';

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const [subtitle, setSubtitle] = useState<string>(BRAND.defaultGreeting);
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; time: string }>
  >([
    {
      role: 'assistant',
      content: BRAND.defaultGreeting,
      time: new Date().toISOString(),
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<{
    backend: boolean;
    linly: boolean;
  } | null>(null);

  const convState = useConversationState();
  const {
    videoRef,
    connectionState,
    sessionId,
    iceState,
    connect,
    disconnect,
  } = useWebRTC();

  const finishSpeakingAfter = useCallback(
    (reply: string, linlyDriven: boolean) => {
      const ms = linlyDriven
        ? Math.max(3000, reply.length * 120)
        : Math.max(1500, reply.length * 100);
      setTimeout(() => convState.finishSpeaking(), ms);
    },
    [convState],
  );

  const vad = useVAD({
    onSpeechStart: useCallback(() => {
      if (convState.isSpeaking) {
        handleInterrupt();
      }
    }, [convState.isSpeaking]),
    onSpeechEnd: useCallback(() => {
      if (convState.state === 'LISTENING') {
        convState.finishListening();
        setSubtitle('嗯，让我想想...');
      }
    }, [convState.state]),
  });

  useIdleTimer(() => {
    if (convState.state === 'IDLE') {
      const greeting = `${BRAND.persona}在呢，想聊点什么？`;
      setSubtitle(greeting);
      setMessages((prev) => [
        ...prev.slice(-4),
        { role: 'assistant', content: greeting, time: new Date().toISOString() },
      ]);
    }
  }, 30000);

  const handleInterrupt = useCallback(async () => {
    convState.interrupt();
    setSubtitle('好的，我听着呢');
    await triggerInterrupt(sessionId ?? undefined);
    convState.startListening();
    if (!vad.isSupported) {
      vad.start();
    }
  }, [convState, vad, sessionId]);

  const handleSendText = useCallback(async () => {
    const text = inputText.trim();
    if (!text || convState.isProcessing) return;

    const userMsg = {
      role: 'user' as const,
      content: text,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-4), userMsg]);
    setInputText('');

    if (convState.state === 'IDLE') {
      convState.startSpeaking();
    }
    setSubtitle('让我想想...');

    try {
      const res = await chatText(text, 'default', undefined, sessionId);
      const reply = res.reply || '嗯，我听到了。';

      convState.startSpeaking();
      setSubtitle(reply);
      setMessages((prev) => [
        ...prev.slice(-4),
        { role: 'assistant', content: reply, time: new Date().toISOString() },
      ]);

      finishSpeakingAfter(reply, Boolean(res.driven_by_linly));
    } catch {
      setSubtitle('抱歉，网络不太好，请再说一次。');
      convState.reset();
    }
  }, [inputText, convState, sessionId, finishSpeakingAfter]);

  const handleVoiceToggle = useCallback(
    async (recording: boolean) => {
      setIsRecording(recording);
      if (recording) {
        if (convState.isSpeaking) {
          await handleInterrupt();
        }
        convState.startListening();
        vad.start();
        setSubtitle('嗯，我听着呢...');
      } else {
        convState.finishListening();
        vad.stop();
        setSubtitle('让我想想...');
      }
    },
    [convState, vad, handleInterrupt],
  );

  const handleVoiceResult = useCallback(
    async (audioBlob: Blob) => {
      setSubtitle('正在听...');
      try {
        const res = await uploadAudio(audioBlob, 'default', sessionId);
        const reply = res.reply || '我听到了您的声音。';

        convState.startSpeaking();
        setSubtitle(reply);
        setMessages((prev) => [
          ...prev.slice(-4),
          { role: 'assistant', content: reply, time: new Date().toISOString() },
        ]);

        finishSpeakingAfter(reply, Boolean(res.driven_by_linly));
      } catch {
        setSubtitle('抱歉，没听清楚，请再说一次。');
        convState.reset();
      }
    },
    [convState, sessionId, finishSpeakingAfter],
  );

  useEffect(() => {
    if (vad.isSupported) {
      vad.start();
    }
    return () => {
      vad.stop();
    };
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    healthCheckFull().then(setServiceHealth);
    const t = setInterval(() => healthCheckFull().then(setServiceHealth), 20000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-2 py-2">
        <Circle
          size={12}
          className={
            convState.state === 'LISTENING'
              ? 'text-green-500 animate-pulse'
              : convState.state === 'SPEAKING'
                ? 'text-orange-500'
                : convState.state === 'THINKING'
                  ? 'text-yellow-500 animate-pulse'
                  : 'text-gray-400'
          }
          fill="currentColor"
        />
        <span className="text-lg font-medium text-warm-text-light">
          {STATE_LABELS[convState.state]}
        </span>
      </div>

      {serviceHealth && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-lg bg-black/5 text-xs text-warm-text-light flex flex-wrap gap-3 items-center">
          <span>API {serviceHealth.backend ? '✓' : '✗'}</span>
          <span>Linly {serviceHealth.linly ? '✓' : '✗'}</span>
          <span>WebRTC {connectionState}</span>
          {sessionId != null && <span>session {sessionId}</span>}
          {iceState && <span>ICE {iceState}</span>}
          {(connectionState === 'failed' || connectionState === 'idle') && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-warm-primary"
              onClick={() => {
                disconnect();
                connect();
              }}
            >
              <RefreshCw size={12} /> 重连
            </button>
          )}
        </div>
      )}

      <div
        className="flex-1 flex items-center justify-center bg-black rounded-2xl mx-4 mt-1 overflow-hidden"
        style={{ minHeight: '55%' }}
      >
        <AvatarPlayer
          videoRef={videoRef}
          connectionState={connectionState}
          iceState={iceState}
          sessionId={sessionId}
        />
      </div>

      <div className="px-4 py-2">
        <SubtitleBar text={subtitle} />
      </div>

      <div className="px-4 py-1 flex-shrink-0" style={{ maxHeight: '80px' }}>
        <ChatHistory messages={messages.slice(-3)} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border-t border-warm-border">
        <div className="flex-1 flex gap-2">
          <input
            className="input-large flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
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

        <VoiceButton
          isRecording={isRecording}
          onToggle={handleVoiceToggle}
          onResult={handleVoiceResult}
        />
      </div>
    </div>
  );
}
