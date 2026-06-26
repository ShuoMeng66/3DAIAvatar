# SESSION UI-FIX — 全站滚动 + 首页/导航交互

## 问题

- 首页/整页无法手指或滚轮上下滑动
- 功能卡片与按钮缺少 hover/active 反馈，交互发闷
- 移动端 viewport 禁止缩放，影响手感

## 改动摘要

### 1. Layout.tsx — 滚动架构

- `<main>` 改为 `flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-main`
- 顶栏、底栏保持 `flex-shrink-0`，仅 main 区域滚动
- 路由切换时 `mainRef.scrollTo(0, 0)`
- 底栏 Tab：`min-w/min-h 48px`、`scale-105`（active）、`transition-all duration-200`、`tap-scale`
- Outlet 外包 `route-fade` 150ms 淡入

### 2. LandingPage.tsx

- 根容器：`min-h-full px-6 py-6 pb-8 pt-4`，移除 `h-full justify-center overflow-hidden`
- 三张功能卡片可点击，带 `ChevronRight`、hover/active 缩放与阴影
  - 语音陪聊 → `/chat`
  - 全息展示 → `/hologram`
  - 温暖智伴 → `/chat`
- 「开始聊天」150ms 延迟后 navigate，防误触
- 次按钮 outline 同样具备 active 反馈

### 3. index.html viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

已删除 `maximum-scale=1.0, user-scalable=no`。

### 4. ChatPage / SettingsPage 兼容

- **ChatPage**：`min-h-full flex flex-col`；数字人区 `flex-1 min-h-0`；输入栏 `flex-shrink-0`
- **SettingsPage**：移除自身 `overflow-y-auto h-full`，依赖 Layout main 统一滚动
- **UiPreviewPage**：同上

### 5. index.css 全局 utilities

- `.tap-scale:active { transform: scale(0.98); }`
- `.scroll-main { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }`
- `.route-fade` 150ms 淡入
- `@media (prefers-reduced-motion: reduce)` 关闭缩放与动画

### 6. Button.tsx

- 默认增加 `active:scale-[0.98] tap-scale`

## 未改动

- API、路由路径
- 紫色主题 tokens（`tokens.css` / `@theme`）

## 验收清单

- [x] 首页内容超出屏幕时可上下滑
- [x] 顶栏、底栏固定不随内容滚动
- [x] 功能卡片有缩放反馈且可跳转
- [x] 底部 Tab 切换有过渡与 active 样式
- [x] main 区域 `overflow-y: auto`

## 浏览器 Console 快速验证

```javascript
const main = document.querySelector('main');
console.log(main?.scrollHeight, main?.clientHeight, getComputedStyle(main).overflowY);
// overflowY 应为 auto；scrollHeight > clientHeight 时可滚
```

## 涉及文件

- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/LandingPage.tsx`
- `frontend/src/pages/ChatPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/pages/UiPreviewPage.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/index.css`
- `frontend/index.html`
