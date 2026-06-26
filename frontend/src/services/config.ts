/**
 * API 配置
 * 本地开发：默认 http://localhost:8010
 * 分布式部署：设置环境变量 VITE_API_BASE 指向服务器 IP
 *   例：VITE_API_BASE=http://192.168.1.100:8010 npm run dev -- --host 0.0.0.0
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8010';
export const LINLY_PUBLIC_URL =
  import.meta.env.VITE_LINLY_PUBLIC_URL || '';
/** 默认 true；设为 false 时使用静态图 + TTS audio_url 简单模式 */
export const USE_WEBRTC = import.meta.env.VITE_USE_WEBRTC !== 'false';