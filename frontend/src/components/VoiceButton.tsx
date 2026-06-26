import { useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  isRecording: boolean;
  onToggle: (recording: boolean) => void;
  onResult: (audioBlob: Blob) => void;
}

export default function VoiceButton({ isRecording, onToggle, onResult }: VoiceButtonProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (blob.size > 0) onResult(blob);
      };

      mediaRecorder.start();
      onToggle(true);
    } catch {
      onToggle(false);
    }
  }, [onToggle, onResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      onToggle(false);
    }
  }, [onToggle]);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className={[
          'w-16 h-16 min-w-[64px] min-h-[64px] rounded-full flex items-center justify-center transition-all duration-200',
          isRecording
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-400/50'
            : 'bg-purple-primary hover:bg-purple-primary-hover shadow-md shadow-purple-500/30',
        ].join(' ')}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        aria-label={isRecording ? '松开停止' : '按住说话'}
      >
        {isRecording ? (
          <MicOff size={32} className="text-white" />
        ) : (
          <Mic size={32} className="text-white" />
        )}
      </button>
      <span className="text-base text-purple-text-muted font-medium">
        {isRecording ? '松开停止' : '按住说话'}
      </span>
    </div>
  );
}
