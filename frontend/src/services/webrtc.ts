import { sendOffer } from './api';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS);
}

export async function connectWebRTC(
  pc: RTCPeerConnection,
  onRemoteStream: (stream: MediaStream) => void,
  onStateChange: (state: string) => void
): Promise<void> {
  // 监听连接状态
  pc.oniceconnectionstatechange = () => {
    onStateChange(pc.iceConnectionState);
  };

  pc.onconnectionstatechange = () => {
    onStateChange(pc.connectionState);
  };

  // 监听远程视频流
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  // 添加接收器
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });

  // 创建 offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // 发送 offer 到后端
  const answer = await sendOffer(offer.sdp || '', offer.type || 'offer');

  if (answer.sdp && answer.type === 'answer') {
    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answer.sdp })
    );
  }
}

export function closeWebRTC(pc: RTCPeerConnection): void {
  pc.close();
}