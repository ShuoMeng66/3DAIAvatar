import { API_BASE } from './config';

// ============================================================
// ElderTalk API 客户端
// 开发环境: http://localhost:8010
// 生产环境: Cloudflare Worker URL
// ============================================================

interface ChatResponse {
  reply: string;
  session_id?: string;
  status: string;
}

/**
 * 文字对话
 */
export async function chatText(
  text: string,
  sessionId: string = 'default',
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, session_id: sessionId, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { reply: err.reply || '抱歉，网络不太好，请再说一次。', status: 'error' };
  }
  return res.json();
}

/**
 * 语音对话（上传音频 → ASR → LLM 回复）
 */
export async function uploadAudio(
  audioBlob: Blob,
  sessionId: string = 'default'
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  formData.append('session_id', sessionId);

  const res = await fetch(`${API_BASE}/api/v1/chat/voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    return { reply: '抱歉，没听清楚，请再说一次。', status: 'error' };
  }
  return res.json();
}

/**
 * 流式对话（SSE）
 */
export function chatStream(
  text: string,
  sessionId: string = 'default',
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, session_id: sessionId }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      onError(new Error('流式请求失败'));
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) { onDone(); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) { onDone(); return; }
            if (data.token) onToken(data.token);
          } catch {}
        }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err);
  });

  return controller;
}

/**
 * TTS 语音合成
 */
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer | null> {
  const res = await fetch(`${API_BASE}/api/v1/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  return res.arrayBuffer();
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`);
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * WebRTC Offer（仅本地开发环境使用）
 */
export async function sendOffer(
  sdp: string,
  type: string
): Promise<{ sdp: string; type: string }> {
  const res = await fetch(`${API_BASE}/api/v1/offer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sdp, type }),
  });
  return res.json();
}