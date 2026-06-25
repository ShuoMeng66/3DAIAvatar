/**
 * useCabinetSync — 全息仓 SSE 同步 Hook
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE } from '../services/config';

export interface CabinetSyncState {
  subtitle: string;
  audioUrl: string | null;
  isSpeaking: boolean;
  isInterrupted: boolean;
  linlyDriven: boolean;
}

const RECONNECT_DELAY = 3000;

export function useCabinetSync() {
  const [state, setState] = useState<CabinetSyncState>({
    subtitle: '',
    audioUrl: null,
    isSpeaking: false,
    isInterrupted: false,
    linlyDriven: false,
  });

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sseUrl = `${API_BASE}/api/v1/cabinet/events`;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(sseUrl);
    esRef.current = es;

    es.addEventListener('subtitle', (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({ ...prev, subtitle: data.text }));
    });

    es.addEventListener('speak_start', (e) => {
      const data = JSON.parse(e.data);
      const linlyDriven = Boolean(data.linly_driven);
      setState((prev) => ({
        ...prev,
        audioUrl: linlyDriven ? null : data.audio_url,
        isSpeaking: true,
        linlyDriven,
        subtitle: data.text || prev.subtitle,
      }));
    });

    es.addEventListener('speak_end', () => {
      setState((prev) => ({ ...prev, isSpeaking: false }));
    });

    es.addEventListener('interrupt', () => {
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
      setTimeout(() => {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isInterrupted: false }));
        }
      }, 500);
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }, [sseUrl]);

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
