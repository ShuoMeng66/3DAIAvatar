/**
 * Barge-in 打断管理器
 * 当数字人正在说话时检测到用户开口，发送打断信号
 */

import { API_BASE } from './config';

let isInterrupting = false;

/**
 * 发送打断信号到后端
 */
async function sendInterrupt(linlySessionId?: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/interrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linly_session_id: linlySessionId ?? undefined,
      }),
    });
    const data = await res.json();
    return data.status === 'ok';
  } catch (err) {
    console.error('打断请求失败:', err);
    return false;
  }
}

export async function triggerInterrupt(
  linlySessionId?: number,
): Promise<boolean> {
  if (isInterrupting) return false;
  isInterrupting = true;

  try {
    const success = await sendInterrupt(linlySessionId);

    // 停止所有本地播放器中的音频
    stopAllLocalAudio();

    console.log(`打断: ${success ? '成功' : '失败'}`);
    return success;
  } finally {
    isInterrupting = false;
  }
}

/**
 * 停止所有本地音频播放
 * 查找并停止所有 <audio> 和 <video> 元素
 */
function stopAllLocalAudio(): void {
  document.querySelectorAll('audio, video').forEach(el => {
    const media = el as HTMLMediaElement;
    if (!media.paused) {
      media.pause();
      media.currentTime = 0;
    }
  });
}

/**
 * 检查打断状态
 */
export async function checkInterruptStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/interrupt/status`);
    const data = await res.json();
    return data.interrupted === true;
  } catch {
    return false;
  }
}

export { isInterrupting };