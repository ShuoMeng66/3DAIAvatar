/**
 * WebRTC 服务层
 *
 * 建立与 Linly-Talker-Stream 的 WebRTC 连接，接收数字人视频流。
 * 信令通过后端 POST /offer 代理。
 */

import { sendOffer, type OfferResponse } from './api';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceStateChange: (state: RTCIceConnectionState) => void;
  onPeerConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onSessionId?: (sessionId: number) => void;
}

export interface ConnectWebRTCResult {
  sessionId?: number;
}

/**
 * 创建 RTCPeerConnection 实例
 */
export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS);
}

function validateAnswer(answer: OfferResponse): void {
  if (!answer.sdp || answer.type !== 'answer') {
    throw new Error(
      `Invalid SDP answer: missing sdp or type (got type=${answer.type ?? 'undefined'})`,
    );
  }
}

/**
 * 绑定 MediaStream 到 video 元素并尝试播放
 */
export function bindStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream,
): void {
  video.srcObject = stream;
  void video.play().catch((err) => {
    console.warn('[WebRTC] video.play() failed:', err);
  });
}

/**
 * 建立 WebRTC 连接
 *
 * 流程：
 * 1. addTransceiver (audio + video, recvonly) — 与 Linly 官方 web 客户端一致
 * 2. createOffer → setLocalDescription
 * 3. POST /offer → 后端代理到 Linly-Talker-Stream
 * 4. setRemoteDescription(answer) + 保存 sessionid
 * 5. ontrack → 绑定远程视频流
 */
export async function connectWebRTC(
  pc: RTCPeerConnection,
  callbacks: WebRTCCallbacks,
): Promise<ConnectWebRTCResult> {
  const {
    onRemoteStream,
    onIceStateChange,
    onPeerConnectionStateChange,
    onSessionId,
  } = callbacks;
  let sessionId: number | undefined;

  try {
    pc.oniceconnectionstatechange = () => {
      onIceStateChange(pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      onPeerConnectionStateChange?.(pc.connectionState);
    };

    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.addTransceiver('video', { direction: 'recvonly' });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.debug('[WebRTC] sending offer...');
    const answer = await sendOffer(offer.sdp ?? '', offer.type ?? 'offer');
    validateAnswer(answer);

    if (answer.sessionid != null) {
      sessionId = answer.sessionid;
      onSessionId?.(sessionId);
      console.debug('[WebRTC] sessionid:', sessionId);
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answer.sdp }),
    );
    console.debug('[WebRTC] answer received');

    return { sessionId };
  } catch (err) {
    console.error('[WebRTC]', err);
    throw err;
  }
}

/**
 * 关闭 WebRTC 连接并释放资源
 */
export function closeWebRTC(pc: RTCPeerConnection): void {
  pc.close();
}

/**
 * ICE 状态是否表示媒体通道已建立
 */
export function isMediaConnected(state: string): boolean {
  return state === 'connected' || state === 'completed';
}

export const ICE_TIMEOUT_MS = 15000;

export const ICE_TIMEOUT_MESSAGE =
  '视频需要 AutoDL 8000 端口 UDP 公网映射，请使用公网 URL 访问';
