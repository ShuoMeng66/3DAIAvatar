# HOLOGRAM_CABINET.md — 全息仓硬件与展示规范

## 1. 硬件规格

| 项目 | 参数 |
|------|------|
| 设备类型 | 全息仓（Hologram Cabinet） |
| 显示方式 | HDMI 直连电脑第二显示器 |
| 分辨率 | 1440 × 2560（竖屏 9:16） |
| 物理尺寸 | 2K 竖屏，适配全息仓投影面板 |
| 连接方式 | 有线 HDMI，无网络延迟 |
| 操作系统 | Windows，扩展桌面模式 |

## 2. 黑底规范

全息仓通过半透半反玻璃/全息膜投影成像，**背景必须是纯黑 #000000**：

- 黑色像素 → 透明（不发光）→ 背景不可见，数字人浮空显示
- 白色/浅色像素 → 发光反射 → 可见内容
- 禁止白底、浅灰、渐变背景（会破坏全息效果，导致整面玻璃可见）

### 设计要求

- 背景：`#000000`，无渐变、无背景图
- 文字：白色 `#ffffff`，低透明度用作辅助提示
- 场景区：纯黑背景，仅渲染数字人/3D 内容
- 字幕区：白字黑底，半透明阴影

## 3. 双屏架构

```
┌─────────────────┐      ┌─────────────────────┐
│   主显示器        │      │  全息仓（第二显示器）   │
│   (横屏 16:9)    │      │  (竖屏 9:16 2K)      │
│                  │      │                      │
│  /#/chat         │      │  /#/cabinet          │
│  控制面板        │      │  全息展示页            │
│  /#/hologram     │      │  3D 场景 + 数字人      │
│  控制面板        │      │  字幕显示             │
│                  │      │  SSE 实时同步         │
└─────────────────┘      └─────────────────────┘
       HDMI 1                     HDMI 2
```

## 4. 路由

- 全息仓访问：`http://localhost:5173/#/cabinet`
- 主控制台：`http://localhost:5173/#/chat`
- 控制面板：`http://localhost:5173/#/hologram`
- 全息仓页面**不使用 Layout**（无导航栏、无按钮、无 UI 控件）

## 5. 双屏部署步骤

### 5.1 硬件连接

1. 将第二显示器（全息仓屏幕）通过 HDMI 线连接到电脑
2. Windows 设置 → 显示 → 多显示器 → 选择「扩展这些显示器」
3. 将第二显示器设置为竖屏模式（显示方向 → 纵向）
4. 确认第二显示器分辨率为 1440×2560（或最接近的竖屏分辨率）

### 5.2 一键启动

**Windows：**
```powershell
.\scripts\start_cabinet.ps1
```

**Linux/macOS：**
```bash
chmod +x scripts/start_cabinet.sh
./scripts/start_cabinet.sh
```

脚本会自动：
- 启动后端（`uvicorn`，端口 8010）
- 启动前端（`npm run dev`，端口 5173）
- 在主屏打开 `/#/chat` 控制端
- 打印副屏 Chrome kiosk 命令

### 5.3 副屏启动

在 Windows 上，将 Chrome kiosk 命令复制到终端执行：
```bat
chrome.exe --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:5173/#/cabinet
```

在 Linux 上：
```bash
google-chrome --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:5173/#/cabinet
```

> **注意**：`--window-position` 的第一个参数（1920）是主显示器宽度。如果你的主显示器分辨率不同，请调整此值。

### 5.4 手动启动

如果自动脚本不适用，可手动执行：

```bash
# 终端 1：后端
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8010

# 终端 2：前端
cd frontend
npm run dev -- --host 0.0.0.0
```

然后在浏览器中：
- 主屏打开 `http://localhost:5173/#/chat`
- 通过控制面板（`/#/hologram`）的「新窗口打开展示页」按钮打开副屏

## 6. 远程部署注意事项

### 6.1 架构说明

分布式部署时，Linly-Talker-Stream（MuseTalk 数字人引擎）运行在远程 GPU 服务器（如 AutoDL），全息仓 PC 通过浏览器访问前端页面。WebRTC 视频流需要 UDP 直连服务器。

### 6.2 SSH 隧道的局限性

SSH 隧道（如 `ssh -L 8000:localhost:8000`）仅转发 TCP 流量，**无法转发 WebRTC 所需的 UDP 流量**。因此：

- SSH 隧道可以用于转发后端 API（端口 8010）
- SSH 隧道**不能**用于 WebRTC 视频流（端口 8000）
- 远程部署 WebRTC 必须让全息仓 PC 直接访问服务器的 8000 端口

### 6.3 AutoDL 端口映射

如果使用 AutoDL 服务器，需要将 8000 端口映射到公网：

1. 在 AutoDL 控制台 → 实例管理 → 更多 → 端口映射
2. 添加端口映射：`8000` → 公网端口（自动分配）
3. 获取公网访问地址（如 `http://xxx.autodl.xxx:xxxxx`）
4. 在 ElderTalk 后端 `.env` 中配置 `LINLY_STREAM_URL` 指向该公网地址

### 6.4 本机测试不受影响

如果在 AutoDL 服务器本机浏览器中测试（如通过 AutoDL 自带的 JupyterLab 代理），不需要额外配置端口映射，WebRTC 可正常连接 `localhost:8000`。

### 6.5 offer 200 但无画面（决策树）

```
POST /offer 是否 200？
├─ 否 → Linly 未启动 / LINLY_STREAM_URL 错误 / backend 代理失败
└─ 是 → 信令 OK，查媒体层
    ├─ chrome://webrtc-internals → ICE failed
    │   → AutoDL 必须映射 8000 UDP；SSH 隧道不能传视频
    ├─ ICE connected，无 video track
    │   → answer 缺 sdp；运行 scripts/check_webrtc.sh
    └─ 有 track，UI 仍黑
        → 确认 VITE_CABINET_MODE=2d；/chat 页 video 是否挂载
```

完整 AutoDL 步骤见 [docs/deploy/autodl.md](docs/deploy/autodl.md)。

## 7. 故障排查

### 7.1 副屏显示白屏/白底

**原因**：全息仓页面背景必须是纯黑 `#000000`。白屏说明背景色丢失。

**解决**：
- 确认 `cabinet.css` 中 `.cabinet-page` 和 `.cabinet-scene` 的 `background` 均为 `#000000`
- 检查浏览器是否开启了「强制深色模式」导致颜色反转
- 确认环境变量 `VITE_CABINET_BG=#000000` 已设置

### 7.2 副屏无显示/黑屏

**原因**：3D 场景或 VRM 模型加载失败。

**解决**：
- 确认 `assets/models/cabinet/default.vrm` 文件存在
- 打开浏览器控制台（F12）查看报错
- 如果 VRM 未下载，页面会显示黑底错误提示「角色加载失败」
- 可临时设置 `VITE_CABINET_MODE=2d` 切换到 2D 视频降级模式

### 7.3 副屏字幕不更新

**原因**：SSE 连接失败或后端未启动。

**解决**：
- 确认后端服务已启动（`http://localhost:8010/health`）
- 查看浏览器控制台是否有 SSE 连接错误
- 确认 `/chat` 端发送消息后，后端 `/offer` 端点正常响应

### 7.4 副屏音频无声

**原因**：TTS 音频生成失败或浏览器自动播放策略限制。

**解决**：
- 确认 `edge-tts` 已安装：`pip install edge-tts`
- 检查 `backend/data/audio/` 目录是否有生成的 WAV 文件
- Chrome kiosk 模式通常允许自动播放；如仍被阻止，手动点击页面任意位置激活

### 7.5 口型动画不工作

**原因**：VRM 模型未加载或不支持对应 blend shapes。

**解决**：
- 确认 VRM 模型已加载成功（控制台无错误）
- 部分 VRM 模型可能不支持全部口型（a/i/u/e/o），这是正常现象
- 口型动画为 volume-based 简单方案，非真实音素同步

## 8. 与 LED 风扇屏的区别

| 特性 | 全息仓（本项目） | LED 风扇屏 |
|------|-----------------|-----------|
| 显示方式 | HDMI 直连显示器 | LED 旋转灯条 |
| 分辨率 | 1440×2560 | 512×512 |
| 背景 | 纯黑 #000000 | 纯黑 #000000 |
| 3D 场景 | Three.js 实时渲染 | 预录 MP4 视频 |
| 实时交互 | 支持（SSE + WebRTC） | 不支持 |
| 启动方式 | 浏览器 kiosk 模式 | TF 卡 / APP 推送 |
| 相关文档 | 本文件 | HOLOGRAM.md |

**全息仓不需要 `python -m hologram.converter` 或 `hologram/streamer.py`。**

## 9. 当前状态

- [x] 黑底 `/cabinet` 骨架（7A）
- [x] Three.js 3D 场景 + VRM 角色（7B）
- [x] WebRTC 信令 + 2D 降级（7C）
- [x] SSE 同步 + 字幕 + 口型（7D）
- [x] 控制面板 + 双屏部署脚本（7E）
- [ ] 真实 VRM 模型下载并放置于 `assets/models/cabinet/default.vrm`
- [ ] Linly-Talker-Stream 集成验证
- [ ] 环境光传感器自适应亮度
- [ ] 多语言字幕切换