/**
 * useWebRTC — WebRTC 连接管理 Hook
 *
 * 状态：
 * - idle: 初始状态，未连接
 * - connecting: 正在建立连接
 * - waiting_stream: 信令完成，等待 ICE 与首帧
 * - connected: ICE 已连通且已收到视频流
 * - failed: 连接失败（已耗尽重试次数）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPeerConnection,
  connectWebRTC,
  closeWebRTC,
  bindStreamToVideo,
  isMediaConnected,
  ICE_TIMEOUT_MS,
  ICE_TIMEOUT_MESSAGE,
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
  const iceReadyRef = useRef(false);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const iceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failureReasonRef = useRef<string | null>(null);

  const [connectionState, setConnectionState] = useState<WebRTCState>('idle');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [iceState, setIceState] = useState<string>('new');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearIceTimeout = useCallback(() => {
    if (iceTimeoutRef.current) {
      clearTimeout(iceTimeoutRef.current);
      iceTimeoutRef.current = null;
    }
  }, []);

  const markConnected = useCallback(() => {
    if (!mountedRef.current || !hasVideoTrackRef.current || !iceReadyRef.current) {
      return;
    }
    clearIceTimeout();
    setConnectionState('connected');
    setErrorMessage(null);
    connectingRef.current = false;
    retryCountRef.current = 0;
  }, [clearIceTimeout]);

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
    clearIceTimeout();
    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }
    pendingStreamRef.current = null;
    hasVideoTrackRef.current = false;
    iceReadyRef.current = false;
    failureReasonRef.current = null;
    setSessionId(null);
    setConnectionState('idle');
    setIceState('new');
    setErrorMessage(null);
  }, [clearIceTimeout]);

  const connect = useCallback(async () => {
    if (connectingRef.current) {
      return;
    }

    if (pcRef.current) {
      closeWebRTC(pcRef.current);
      pcRef.current = null;
    }

    clearIceTimeout();
    pendingStreamRef.current = null;
    hasVideoTrackRef.current = false;
    iceReadyRef.current = false;
    failureReasonRef.current = null;
    retryCountRef.current = 0;
    setConnectionState('connecting');
    setErrorMessage(null);
    connectingRef.current = true;

    const handleRetry = (): void => {
      if (!mountedRef.current) return;

      clearIceTimeout();
      retryCountRef.current += 1;

      if (retryCountRef.current <= MAX_RETRIES) {
        if (pcRef.current) {
          closeWebRTC(pcRef.current);
          pcRef.current = null;
        }
        hasVideoTrackRef.current = false;
        iceReadyRef.current = false;
        pendingStreamRef.current = null;
        setConnectionState('connecting');
        setTimeout(() => {
          if (mountedRef.current) {
            void attemptConnection();
          }
        }, RETRY_DELAY_MS);
      } else {
        setConnectionState('failed');
        setErrorMessage(failureReasonRef.current ?? 'WebRTC 连接失败');
        connectingRef.current = false;
      }
    };

    const attemptConnection = async (): Promise<void> => {
      if (!mountedRef.current) return;

      const pc = createPeerConnection();
      pcRef.current = pc;

      const startIceTimeout = () => {
        clearIceTimeout();
        iceTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current || iceReadyRef.current) return;
          failureReasonRef.current = ICE_TIMEOUT_MESSAGE;
          setErrorMessage(ICE_TIMEOUT_MESSAGE);
          handleRetry();
        }, ICE_TIMEOUT_MS);
      };

      try {
        await connectWebRTC(pc, {
          onRemoteStream: (stream) => {
            const hasVideo = stream.getVideoTracks().length > 0;
            if (hasVideo) {
              hasVideoTrackRef.current = true;
            }
            if (videoRef.current && mountedRef.current) {
              attachStream(videoRef.current, stream);
            } else {
              pendingStreamRef.current = stream;
            }
            if (mountedRef.current && hasVideo) {
              if (iceReadyRef.current) {
                markConnected();
              } else {
                setConnectionState('waiting_stream');
              }
            }
          },
          onSessionId: (id) => {
            if (mountedRef.current) {
              setSessionId(id);
            }
          },
          onIceStateChange: (state) => {
            if (!mountedRef.current) return;
            setIceState(state);

            if (state === 'checking' || state === 'new') {
              startIceTimeout();
            }

            if (isMediaConnected(state)) {
              iceReadyRef.current = true;
              clearIceTimeout();
              if (hasVideoTrackRef.current) {
                markConnected();
              } else if (mountedRef.current) {
                setConnectionState('waiting_stream');
              }
            }

            if (state === 'failed') {
              failureReasonRef.current = ICE_TIMEOUT_MESSAGE;
              setErrorMessage(ICE_TIMEOUT_MESSAGE);
              handleRetry();
            }
          },
          onPeerConnectionStateChange: (state) => {
            if (!mountedRef.current) return;
            if (state === 'failed') {
              failureReasonRef.current = 'WebRTC 连接失败';
              handleRetry();
            }
          },
        });

        startIceTimeout();
      } catch (err) {
        console.error('[useWebRTC] connect failed:', err);
        if (mountedRef.current) {
          handleRetry();
        }
      }
    };

    await attemptConnection();
  }, [markConnected, clearIceTimeout]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectingRef.current = false;
      clearIceTimeout();
      if (pcRef.current) {
        closeWebRTC(pcRef.current);
        pcRef.current = null;
      }
    };
  }, [clearIceTimeout]);

  return {
    videoRef,
    connectionState,
    sessionId,
    iceState,
    errorMessage,
    connect,
    disconnect,
  };
}
