import { useState, useEffect, useRef, useCallback } from 'react';

// VAD 状态
type VADStatus = 'inactive' | 'listening' | 'speaking';

interface UseVADOptions {
  /** 检测到语音开始时的回调 */
  onSpeechStart?: () => void;
  /** 检测到语音结束时的回调 */
  onSpeechEnd?: () => void;
  /** 是否持续监听 */
  continuous?: boolean;
}

interface UseVADReturn {
  status: VADStatus;
  /** 启动 VAD 监听 */
  start: () => void;
  /** 停止 VAD 监听 */
  stop: () => void;
  /** 音频上下文 */
  isSupported: boolean;
}

export function useVAD(options: UseVADOptions = {}): UseVADReturn {
  const [status, setStatus] = useState<VADStatus>('inactive');
  const [isSupported, setIsSupported] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { onSpeechStart, onSpeechEnd } = options;

  // 使用 Web Audio API 实现 VAD
  const startVAD = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsSupported(true);
      setStatus('listening');

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const SPEECH_THRESHOLD = 50; // 能量阈值
      const SILENCE_TIMEOUT = 1000; // 静音超时 1s

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // 计算平均能量
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;

        if (avg > SPEECH_THRESHOLD) {
          // 检测到语音
          if (!speakingRef.current) {
            speakingRef.current = true;
            setStatus('speaking');
            onSpeechStart?.();
          }
          // 重置静音计时器
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          // 静音
          if (speakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              speakingRef.current = false;
              setStatus('listening');
              onSpeechEnd?.();
              silenceTimerRef.current = null;
            }, SILENCE_TIMEOUT);
          }
        }

        rafRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch {
      setIsSupported(false);
      setStatus('inactive');
    }
  }, [onSpeechStart, onSpeechEnd]);

  const stopVAD = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    analyserRef.current = null;
    speakingRef.current = false;
    setStatus('inactive');
  }, []);

  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, [stopVAD]);

  return {
    status,
    start: startVAD,
    stop: stopVAD,
    isSupported,
  };
}