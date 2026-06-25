/**
 * WebRTC smoke — 需 backend + Linly 运行时手动执行
 * npx playwright test e2e/smoke_webrtc.spec.ts
 */
import { test, expect } from '@playwright/test';

test.describe('ElderTalk WebRTC smoke', () => {
  test('chat page has video element and loads', async ({ page }) => {
    await page.goto('http://localhost:5173/#/chat');
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 15000 });
  });

  test('health endpoint', async ({ request }) => {
    const res = await request.get('http://localhost:8010/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
