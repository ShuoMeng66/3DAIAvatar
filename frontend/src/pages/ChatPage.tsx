import { useState, useCallback, useEffect, useRef } from 'react';
import AvatarPlayer from '../components/AvatarPlayer';
import SubtitleBar from '../components/SubtitleBar';
import VoiceButton from '../components/VoiceButton';
import ChatHistory from '../components/ChatHistory';
import ConnectionStatus from '../components/ConnectionStatus';
import { useWebRTC } from '../hooks/useWebRTC';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useConversationState, STATE_LABELS } from '../hooks/useConversationState';
import { useVAD } from '../hooks/useVAD';
import { triggerInterrupt } from '../services/bargein';
import { chatText, uploadAudio, healthCheckFull } from '../services/api';
import { BRAND } from '../config/brand';
import { API_BASE, USE_WEBRTC } from '../services/config';
import { Send, Circle, RefreshCw } from 'lucide-react';

function playSimpleAudio(audioRef: React.RefObject<HTMLAudioElement | null>, url: string) {
  if (!audioRef.current || !url) return;
  audioRef.current.src = url.startsWith('http') ? url : `${API_BASE}${url}`;
  void audioRef.current.play().catch((err) => {
    console.warn('[ChatPage] audio play failed:', err);
  });
}

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
  const simpleAudioRef = useRef<HTMLAudioElement>(null);

  const convState = useConversationState();
  const {
    videoRef,
    connectionState,
    sessionId,
    iceState,
    errorMessage,
    connect,
    disconnect,
  } = useWebRTC();

  const finishSpeakingAfter = useCallback(
    (reply: string, linlyDriven: boolean, audioUrl?: string) => {
      if (!USE_WEBRTC && audioUrl) {
        playSimpleAudio(simpleAudioRef, audioUrl);
      }
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
        convState.interrupt();
        setSubtitle('好的，我听着呢');
        if (USE_WEBRTC) {
          void triggerInterrupt(sessionId ?? undefined);
        }
        if (simpleAudioRef.current) {
          simpleAudioRef.current.pause();
        }
        convState.startListening();
      }
    }, [convState, sessionId]),
    onSpeechEnd: useCallback(() => {
      if (convState.state === 'LISTENING') {
        convState.finishListening();
        setSubtitle('嗯，让我想想...');
      }
    }, [convState]),
  });

  const handleInterrupt = useCallback(async () => {
    convState.interrupt();
    setSubtitle('好的，我听着呢');
    if (USE_WEBRTC) {
      await triggerInterrupt(sessionId ?? undefined);
    }
    if (simpleAudioRef.current) {
      simpleAudioRef.current.pause();
    }
    convState.startListening();
    if (!vad.isSupported) {
      vad.start();
    }
  }, [convState, vad, sessionId]);

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
      const res = await chatText(
        text,
        'default',
        undefined,
        USE_WEBRTC ? sessionId : undefined,
      );
      const reply = res.reply || '嗯，我听到了。';

      convState.startSpeaking();
      setSubtitle(reply);
      setMessages((prev) => [
        ...prev.slice(-4),
        { role: 'assistant', content: reply, time: new Date().toISOString() },
      ]);

      finishSpeakingAfter(reply, Boolean(res.driven_by_linly), res.audio_url);
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
        const res = await uploadAudio(
          audioBlob,
          'default',
          USE_WEBRTC ? sessionId : undefined,
        );
        const reply = res.reply || '我听到了您的声音。';

        convState.startSpeaking();
        setSubtitle(reply);
        setMessages((prev) => [
          ...prev.slice(-4),
          { role: 'assistant', content: reply, time: new Date().toISOString() },
        ]);

        finishSpeakingAfter(reply, Boolean(res.driven_by_linly), res.audio_url);
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
    if (USE_WEBRTC) {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    healthCheckFull().then(setServiceHealth);
    const t = setInterval(() => healthCheckFull().then(setServiceHealth), 20000);
    return () => clearInterval(t);
  }, []);

  const stateDotClass =
    convState.state === 'LISTENING'
      ? 'text-purple-success animate-pulse'
      : convState.state === 'SPEAKING'
        ? 'text-purple-primary animate-purple-pulse'
        : convState.state === 'THINKING'
          ? 'text-amber-500 animate-pulse'
          : 'text-purple-text-muted';

  const avatarConnectionState = USE_WEBRTC ? connectionState : 'ready';

  return (
    <div className="flex flex-col min-h-full">
      <audio ref={simpleAudioRef} className="hidden" />

      <div className="flex items-center justify-center gap-2 py-2">
        <Circle size={12} className={stateDotClass} fill="currentColor" />
        <span className="text-lg font-medium text-purple-text-muted">
          {STATE_LABELS[convState.state]}
        </span>
      </div>

      {serviceHealth && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-xl glass-panel text-xs flex flex-wrap gap-3 items-center">
          <ConnectionStatus backend={serviceHealth.backend} linly={serviceHealth.linly} />
          {USE_WEBRTC && (
            <>
              <span className="text-purple-text-muted">WebRTC {connectionState}</span>
              {sessionId != null && (
                <span className="text-purple-text-muted">session {sessionId}</span>
              )}
              {iceState && <span className="text-purple-text-muted">ICE {iceState}</span>}
              {errorMessage && (
                <span className="text-purple-error w-full">{errorMessage}</span>
              )}
              {(connectionState === 'failed' || connectionState === 'idle') && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-purple-primary"
                  onClick={() => {
                    disconnect();
                    connect();
                  }}
                >
                  <RefreshCw size={12} /> 重连
                </button>
              )}
            </>
          )}
          {!USE_WEBRTC && (
            <span className="text-purple-text-muted">简单模式（静态形象 + 语音）</span>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex items-center justify-center rounded-3xl mx-4 mt-1 overflow-hidden ring-2 ring-purple-light/60 bg-avatar-stage">
        <AvatarPlayer
          videoRef={videoRef}
          connectionState={avatarConnectionState}
          iceState={iceState}
          sessionId={sessionId}
          errorMessage={errorMessage}
          simpleMode={!USE_WEBRTC}
          isSpeaking={convState.state === 'SPEAKING'}
        />
      </div>

      <div className="px-4 py-2">
        <SubtitleBar text={subtitle} />
      </div>

      <div className="px-4 py-1 flex-shrink-0 max-h-[120px] overflow-y-auto">
        <ChatHistory messages={messages.slice(-3)} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 glass-panel border-t border-purple-border flex-shrink-0">
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
