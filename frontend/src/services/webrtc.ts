/**
 * WebRTC 服务层
 *
 * 建立与 Linly-Talker-Stream 的 WebRTC 连接，接收数字人视频流。
 * 信令通过后端 /api/v1/offer 代理。
 */

import { sendOffer } from './api';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onStateChange: (state: string) => void;
}

/**
 * 创建 RTCPeerConnection 实例
 */
export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS);
}

/**
 * 建立 WebRTC 连接
 *
 * 流程：
 * 1. addTransceiver (audio + video, recvonly)
 * 2. createOffer → setLocalDescription
 * 3. POST /api/v1/offer → 后端代理到 Linly-Talker-Stream
 * 4. setRemoteDescription(answer)
 * 5. ontrack → 绑定远程视频流
 */
export async function connectWebRTC(
  pc: RTCPeerConnection,
  callbacks: WebRTCCallbacks,
): Promise<void> {
  const { onRemoteStream, onStateChange } = callbacks;

  // 监听 ICE 连接状态
  pc.oniceconnectionstatechange = () => {
    onStateChange(pc.iceConnectionState);
  };

  // 监听连接状态
  pc.onconnectionstatechange = () => {
    onStateChange(pc.connectionState);
  };

  // 监听远程视频流
  pc.ontrack = (event) => {
    if (event.streams?.[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  // 添加接收器（仅接收，不发送）
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });

  // 创建 SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // 发送 offer 到后端信令代理
  const answer = await sendOffer(offer.sdp ?? '', offer.type ?? 'offer');

  if (answer.sdp && answer.type === 'answer') {
    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answer.sdp }),
    );
  }
}

/**
 * 关闭 WebRTC 连接并释放资源
 */
export function closeWebRTC(pc: RTCPeerConnection): void {
  pc.close();
}