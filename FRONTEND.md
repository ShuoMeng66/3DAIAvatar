# ElderTalk 前端技术文档

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 6.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| react-router-dom | 7.x | 路由管理 |
| lucide-react | 最新 | 图标库 |

## 目录结构

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # 页面布局（标题栏+导航）
│   │   ├── AvatarPlayer.tsx    # WebRTC 数字人视频播放器
│   │   ├── VoiceButton.tsx     # 按住说话按钮
│   │   ├── SubtitleBar.tsx     # 大字幕显示栏
│   │   └── ChatHistory.tsx     # 对话历史（最近5条）
│   ├── pages/
│   │   ├── ChatPage.tsx        # 主对话页 /
│   │   ├── SettingsPage.tsx    # 家属设置页 /settings
│   │   └── HologramPage.tsx    # 全息预览页 /hologram
│   ├── hooks/
│   │   ├── useWebRTC.ts        # WebRTC 连接管理 Hook
│   │   └── useIdleTimer.ts     # 空闲检测 Hook
│   ├── services/
│   │   ├── api.ts              # 后端 API 调用封装
│   │   └── webrtc.ts           # WebRTC PeerConnection 管理
│   ├── App.tsx                 # 路由入口
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── DESIGN.md                   # 设计文档
├── index.html                  # HTML 模板
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | ChatPage | 重定向到 /chat |
| `/chat` | ChatPage | 主对话页（默认首页） |
| `/settings` | SettingsPage | 家属设置（密码保护） |
| `/hologram` | HologramPage | 全息预览与推送 |

使用 HashRouter（`#/chat`），兼容静态文件部署。

## 组件树

```
App
├── HashRouter
│   ├── Layout
│   │   ├── 标题栏（小暖陪聊）
│   │   ├── 底部导航（聊天 | 全息）
│   │   └── Outlet
│   │       ├── ChatPage
│   │       │   ├── AvatarPlayer
│   │       │   ├── SubtitleBar
│   │       │   ├── ChatHistory
│   │       │   ├── VoiceButton
│   │       │   └── 文字输入框
│   │       ├── SettingsPage
│   │       │   ├── 密码验证
│   │       │   ├── 称呼设置
│   │       │   ├── 形象上传
│   │       │   ├── 声音克隆
│   │       │   ├── 提醒事项
│   │       │   └── 人设微调
│   │       └── HologramPage
│   │           ├── 视频预览
│   │           └── 推送按钮
```

## API 对接

### 后端地址
- 开发环境：`http://localhost:8010`
- 生产环境：通过 Nginx 反向代理 `/api/` → `backend:8010`

### 接口列表
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查（每 30s 心跳） |
| POST | /offer | WebRTC SDP 信令 |
| POST | /api/v1/chat/text | 文字对话 |
| POST | /asr | 语音识别（上传 wav） |
| GET | /api/v1/avatar/list | 数字人形象列表 |
| POST | /api/v1/avatar/select | 切换形象 |
| GET | /api/v1/session/{id}/history | 对话历史 |

### WebRTC 流程
1. 创建 RTCPeerConnection（STUN: stun.l.google.com:19302）
2. 添加 transceiver（audio + video recvonly）
3. 创建 SDP offer，发送 POST /offer
4. 接收 SDP answer，设置 remoteDescription
5. 监听 ontrack 事件，将远程视频流绑定到 <video> 元素

## 构建与部署

### 开发
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### 生产构建
```bash
npm run build
# 输出到 dist/
```

### Docker 部署
前端通过 Nginx 容器提供静态文件服务，配置见 `frontend/nginx.conf`。