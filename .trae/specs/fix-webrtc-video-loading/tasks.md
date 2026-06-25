# Tasks

- [x] Task 1: 修复 Backend `/offer` 代理（支持 HTTPS 自签名）
  - [x] 修改 `backend/main.py`：`/offer` 中 `httpx.AsyncClient` 增加 `verify=False`，timeout 提升到 30s
  - [x] 修改 `backend/config.py`：`LINLY_STREAM_URL` 默认值改为 `https://127.0.0.1:8000`
  - [x] 修改 `.env.example`：`LINLY_STREAM_URL` 默认值改为 `https://127.0.0.1:8000`，增加注释说明自签名证书
  - **验证**：`python3 -c "from config import settings; print(settings.LINLY_STREAM_URL)"` 输出 `https://127.0.0.1:8000`

- [x] Task 2: 修复前端 offer 信令路径
  - [x] 修改 `frontend/src/services/api.ts`：`sendOffer()` 路径改为 `${API_BASE}/offer`
  - **验证**：TypeScript 编译通过

- [x] Task 3: 修复健康检查路径
  - [x] 修改 `frontend/src/services/api.ts`：`healthCheck()` 路径改为 `${API_BASE}/health`
  - [x] 修改 `frontend/src/pages/CabinetPage.tsx`：健康检查 URL 改为 `${API_BASE}/health`
  - **验证**：TypeScript 编译通过

- [x] Task 4: ChatPage 自动连接 WebRTC
  - [x] 修改 `frontend/src/pages/ChatPage.tsx`：在 `useEffect` 中调用 `connect()`
  - **验证**：TypeScript 编译通过

- [x] Task 5: 优化 AvatarPlayer 状态文案
  - [x] 修改 `frontend/src/components/AvatarPlayer.tsx`：
    - `idle` →「未连接」
    - `failed` →「连接失败，请检查 Linly 服务」
    - 移除「数字人加载中...」通用文案，改为根据状态显示不同提示
  - **验证**：TypeScript 编译通过

- [x] Task 6: TypeScript 编译验证
  - [x] `npx tsc --noEmit` 零错误
  - **验证**：编译通过

# Task Dependencies
- Task 2 依赖 Task 1（路径要一致）
- Task 3, 4, 5 可并行执行
- Task 6 依赖 Task 2, 3, 4, 5