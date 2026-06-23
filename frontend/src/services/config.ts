/**
 * API 配置
 * 部署后修改 WORKER_URL 为你的 Cloudflare Worker 地址
 */

// Cloudflare Worker 地址（部署 wrangler deploy 后获取）
export const WORKER_URL = 'https://elder-talk-api.medprep.workers.dev';

// 本地开发时使用 localhost
export const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8010'
  : WORKER_URL;