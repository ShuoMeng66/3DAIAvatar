import { useRef, useState } from 'react';

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  const connect = async () => {
    setConnectionState('connecting');
  };

  return { videoRef, connectionState, connect };
}