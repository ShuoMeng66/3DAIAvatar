/**
 * useWebRTC — WebRTC 连接管理 Hook
 *
 * 状态：
 * - idle: 初始状态，未连接
 * - connecting: 正在建立连接
 * - waiting_stream: 信令完成，等待首帧
 * - connected: 已收到视频流
 * - failed: 连接失败（已耗尽重试次数）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPeerConnection,
  connectWebRTC,
  closeWebRTC,
  bindStreamToVideo,
  isMediaConnected,
} from '../services/webrtc';

export type WebRTCState =
  | 'idle'
  | 'connecting'
  | 'waiting_stream'
  | 'connected'
  | 'failed';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function attachStream(
  video: HTMLVideoElement,
  stream: MediaStream,
): void {
  bindStreamToVideo(video, stream);
}

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const hasVideoTrackRef = useRef(false);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);

  const [connectionState, setConnectionState] = useState<WebRTCState>('idle');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [iceState, setIceState] = useState<string>('new');

  const markConnected = useCallback(() => {
    if (!mountedRef.current || !hasVideoTrackRef.current) return;
    setConnectionState('connected');
    connectingRef.current = false;
    retryCountRef.current = 0;
  }, []);

  const applyPendingStream = useCallback(() => {
    const video = videoRef.current;
    const stream = pendingStreamRef.current;
    if (video && stream) {
      attachStream(video, stream);
      pendingStreamRef.current = null;
      markConnected();
    }
  }, [markConnected]);

  useEffect(() => {
    applyPendingStream();
  });

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }
    pendingStreamRef.current = null;
    hasVideoTrackRef.current = false;
    setSessionId(null);
    setConnectionState('idle');
    setIceState('new');
  }, []);

  const connect = useCallback(async () => {
    if (connectingRef.current) {
      return;
    }

    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }

    pendingStreamRef.current = null;
    hasVideoTrackRef.current = false;
    retryCountRef.current = 0;
    setConnectionState('connecting');
    connectingRef.current = true;

    const attemptConnection = async (): Promise<void> => {
      if (!mountedRef.current) return;

      const pc = createPeerConnection();
      pcRef.current = pc;
      let signalReady = false;

      try {
        const result = await connectWebRTC(pc, {
          onRemoteStream: (stream) => {
            const hasVideo = stream.getVideoTracks().length > 0;
            if (hasVideo) {
              hasVideoTrackRef.current = true;
            }
            if (videoRef.current && mountedRef.current) {
              attachStream(videoRef.current, stream);
              if (hasVideo) {
                markConnected();
              }
            } else {
              pendingStreamRef.current = stream;
              if (mountedRef.current && hasVideo) {
                setConnectionState('waiting_stream');
              }
            }
          },
          onSessionId: (id) => {
            if (mountedRef.current) {
              setSessionId(id);
            }
          },
          onStateChange: (state) => {
            if (!mountedRef.current) return;
            setIceState(state);
            if (isMediaConnected(state)) {
              signalReady = true;
              if (hasVideoTrackRef.current) {
                markConnected();
              } else {
                setConnectionState('waiting_stream');
              }
            }
            if (state === 'failed') {
              handleRetry();
            }
          },
        });

        if (result.sessionId != null && mountedRef.current) {
          setSessionId(result.sessionId);
        }

        if (signalReady && !hasVideoTrackRef.current && mountedRef.current) {
          setConnectionState('waiting_stream');
        }
      } catch (err) {
        console.error('[useWebRTC] connect failed:', err);
        if (mountedRef.current) {
          handleRetry();
        }
      }
    };

    const handleRetry = (): void => {
      if (!mountedRef.current) return;

      retryCountRef.current += 1;

      if (retryCountRef.current <= MAX_RETRIES) {
        if (pcRef.current) {
          closeWebRTC(pcRef.current);
          pcRef.current = null;
        }
        hasVideoTrackRef.current = false;
        pendingStreamRef.current = null;
        setTimeout(() => {
          if (mountedRef.current) {
            attemptConnection();
          }
        }, RETRY_DELAY_MS);
      } else {
        setConnectionState('failed');
        connectingRef.current = false;
      }
    };

    await attemptConnection();
  }, [markConnected]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectingRef.current = false;
      if (pcRef.current) {
        closeWebRTC(pcRef.current);
        pcRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    connectionState,
    sessionId,
    iceState,
    connect,
    disconnect,
  };
}
