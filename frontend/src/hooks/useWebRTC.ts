/**
 * useWebRTC — WebRTC 连接管理 Hook
 *
 * 状态：
 * - idle: 初始状态，未连接
 * - connecting: 正在建立连接
 * - connected: 已连接，接收视频流中
 * - failed: 连接失败（已耗尽重试次数）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPeerConnection,
  connectWebRTC,
  closeWebRTC,
} from '../services/webrtc';

export type WebRTCState = 'idle' | 'connecting' | 'connected' | 'failed';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const [connectionState, setConnectionState] = useState<WebRTCState>('idle');

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }
    setConnectionState('idle');
  }, []);

  /**
   * 建立 WebRTC 连接（含自动重连）
   */
  const connect = useCallback(async () => {
    // 先断开旧连接
    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }

    retryCountRef.current = 0;
    setConnectionState('connecting');

    const attemptConnection = async (): Promise<void> => {
      if (!mountedRef.current) return;

      const pc = createPeerConnection();
      pcRef.current = pc;

      try {
        await connectWebRTC(pc, {
          onRemoteStream: (stream) => {
            if (videoRef.current && mountedRef.current) {
              videoRef.current.srcObject = stream;
            }
          },
          onStateChange: (state) => {
            if (state === 'connected' && mountedRef.current) {
              setConnectionState('connected');
              retryCountRef.current = 0; // 重置重试计数
            }
            if (state === 'failed' && mountedRef.current) {
              handleRetry();
            }
          },
        });
      } catch {
        if (mountedRef.current) {
          handleRetry();
        }
      }
    };

    const handleRetry = (): void => {
      if (!mountedRef.current) return;

      retryCountRef.current += 1;

      if (retryCountRef.current <= MAX_RETRIES) {
        // 关闭当前连接，延迟重试
        if (pcRef.current) {
          closeWebRTC(pcRef.current);
          pcRef.current = null;
        }
        setTimeout(() => {
          if (mountedRef.current) {
            attemptConnection();
          }
        }, RETRY_DELAY_MS);
      } else {
        setConnectionState('failed');
      }
    };

    await attemptConnection();
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pcRef.current) {
        closeWebRTC(pcRef.current);
        pcRef.current = null;
      }
    };
  }, []);

  return { videoRef, connectionState, connect, disconnect };
}