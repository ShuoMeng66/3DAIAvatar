/**
 * useCabinetSync — 全息仓 SSE 同步 Hook
 *
 * 订阅后端 /api/v1/cabinet/events SSE 事件流，
 * 实时接收字幕、音频、打断等同步事件。
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface CabinetSyncState {
  subtitle: string;
  audioUrl: string | null;
  isSpeaking: boolean;
  isInterrupted: boolean;
}

const SSE_URL = 'http://localhost:8010/api/v1/cabinet/events';
const RECONNECT_DELAY = 3000;

export function useCabinetSync() {
  const [state, setState] = useState<CabinetSyncState>({
    subtitle: '',
    audioUrl: null,
    isSpeaking: false,
    isInterrupted: false,
  });

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.addEventListener('subtitle', (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({ ...prev, subtitle: data.text }));
    });

    es.addEventListener('speak_start', (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        audioUrl: data.audio_url,
        isSpeaking: true,
        subtitle: data.text || prev.subtitle,
      }));
    });

    es.addEventListener('speak_end', () => {
      setState((prev) => ({ ...prev, isSpeaking: false }));
    });

    es.addEventListener('interrupt', () => {
      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setState((prev) => ({
        ...prev,
        isSpeaking: false,
        audioUrl: null,
        isInterrupted: true,
      }));
      // 重置打断标记
      setTimeout(() => {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isInterrupted: false }));
        }
      }, 500);
    });

    es.addEventListener('state', (e) => {
      const data = JSON.parse(e.data);
      console.log('[CabinetSync] SSE 已连接:', data);
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [connect]);

  return { ...state, audioRef };
}