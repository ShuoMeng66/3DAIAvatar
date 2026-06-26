# Windows 本地一体机部署指南（颐语 ElderTalk）

> **适用场景**：前端、Backend、Linly **都在同一台 Windows 电脑**上运行，用 **本机浏览器** 打开 `http://localhost:5173/#/chat`。  
> 此场景 **不需要** AutoDL 公网端口映射、SSH 隧道；WebRTC 视频走本机 UDP，一般可正常出画。

---

## 0. 你需要准备什么

| 项 | 最低要求 | 推荐 |
|----|----------|------|
| 系统 | Windows 10/11 64 位 | Windows 11 |
| GPU | NVIDIA **8GB+** 显存 | RTX 3060 12GB / 4060 / 4090 |
| 驱动 | [NVIDIA 驱动](https://www.nvidia.com/Download/index.aspx) 最新版 | 支持 CUDA 12.x |
| 磁盘 | 项目 + 模型 **≥ 80GB** 可用空间 | SSD |
| 网络 | 首次下载模型、npm、pip | 可访问 GitHub / PyPI |

### 必装软件

1. **Git for Windows** — https://git-scm.com/download/win  
2. **Python 3.10.x** — https://www.python.org/downloads/（安装时勾选 **Add to PATH**）  
3. **Node.js 20 LTS** — https://nodejs.org/  
4. **uv**（Linly 推荐包管理）— PowerShell 执行：
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
5. **Git Bash**（随 Git 安装，用于跑 Linly 的 bash 脚本）

可选：Visual Studio Build Tools（若 pip 编译某些包失败时再装）。

---

## 1. 克隆项目

打开 **PowerShell** 或 **Git Bash**：

```powershell
cd C:\Projects   # 换成你想放的目录
git clone https://github.com/ShuoMeng66/ElderTalk.git
cd ElderTalk
```

若 GitHub 慢，可用镜像：

```powershell
git clone https://ghfast.top/https://github.com/ShuoMeng66/ElderTalk.git
```

---

## 2. 配置环境变量

### 2.1 根目录 `.env`

```powershell
copy .env.example .env
notepad .env
```

至少填写：

```env
LLM_API_KEY=sk-你的百炼或DeepSeek密钥
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

LINLY_STREAM_URL=http://127.0.0.1:8000
PORT=8010
FRONTEND_ORIGIN=http://localhost:5173
```

### 2.2 前端 `frontend\.env`

```powershell
copy frontend\.env.example frontend\.env
notepad frontend\.env
```

**本地 WebRTC 演示（推荐）**：

```env
VITE_API_BASE=http://localhost:8010
VITE_USE_WEBRTC=true
VITE_CABINET_MODE=2d
```

若 Linly 暂时起不来、只想先看 UI + 文字 + TTS：

```env
VITE_USE_WEBRTC=false
```

---

## 3. 安装 Linly-Talker-Stream（数字人引擎）

在 **Git Bash** 中执行（路径按你的实际目录改）：

```bash
cd /c/Projects/ElderTalk/third_party/Linly-Talker-Stream

# 安装 Linly 环境 + MuseTalk 依赖（约 20~40 分钟）
bash scripts/setup-env.sh musetalk

# 下载 MuseTalk 权重（体积大，需耐心）
bash scripts/download_musetalk_weights.sh
```

确认监听端口为 **8000**（仓库默认已是 8000）：

```bash
grep listenport config/config_musetalk.yaml
# 应看到 listenport: 8000
```

### 数字人形象数据

需有 `data/avatars/musetalk_avatar1/` 等素材。若仓库 clone 后缺失，从已有 AutoDL 环境拷贝，或按 Linly 文档准备 avatar 数据。

---

## 4. 安装 Backend

**PowerShell**（不要用 Linly 的 venv）：

```powershell
cd C:\Projects\ElderTalk\backend
python -m pip install -r requirements.txt
```

验证：

```powershell
python -c "import fastapi; print('backend deps OK')"
```

---

## 5. 安装 Frontend

```powershell
cd C:\Projects\ElderTalk\frontend
npm install
```

---

## 6. 启动三进程（三个终端窗口）

必须 **按顺序** 启动，且 **三个窗口都保持打开**。

### 终端 1 — Linly（8000）

**Git Bash** 或 PowerShell：

```bash
cd /c/Projects/ElderTalk/third_party/Linly-Talker-Stream
export DASHSCOPE_API_KEY="你的LLM_API_KEY"
uv run python src/server/app.py --config config/config_musetalk.yaml
```

PowerShell 等价写法：

```powershell
cd C:\Projects\ElderTalk\third_party\Linly-Talker-Stream
$env:DASHSCOPE_API_KEY = (Get-Content ..\..\.env | Select-String '^LLM_API_KEY=').ToString().Split('=',2)[1]
uv run python src/server/app.py --config config/config_musetalk.yaml
```

等到日志出现 **「服务已就绪」**（首次加载模型约 1~3 分钟）。

验收：

```powershell
curl http://127.0.0.1:8000/health
# 若 Linly 以 HTTPS 启动，改用：
curl -k https://127.0.0.1:8000/health
```

### 终端 2 — Backend（8010）

```powershell
cd C:\Projects\ElderTalk\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8010
```

验收：

```powershell
curl http://localhost:8010/health
```

### 终端 3 — Frontend（5173）

```powershell
cd C:\Projects\ElderTalk\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 7. 浏览器验收

1. 打开 Chrome / Edge：**http://localhost:5173/#/chat**
2. 状态栏应显示：`API ✓`、`Linly ✓`
3. WebRTC 应变为 `connected`，**数字人区域有画面**
4. 输入文字发送，观察口型/语音

其他页面：

| 地址 | 说明 |
|------|------|
| http://localhost:5173/#/ | 首页 |
| http://localhost:5173/#/ui-preview | UI 组件预览 |
| http://localhost:5173/#/cabinet | 全息仓展示页 |
| http://localhost:5173/#/settings | 家属设置（默认密码 `123456`） |

### 自检脚本

```powershell
cd C:\Projects\ElderTalk
.\scripts\check_webrtc.ps1
```

---

## 8. 投资人演示建议

1. **同一台演示机**：笔记本/台式机连投影仪，浏览器全屏 `#/chat`
2. **提前 5 分钟**按「终端 1→2→3」启动，确认有视频再请人入座
3. **备用**：`VITE_USE_WEBRTC=false` + 录一段本机 WebRTC 成功的视频，远程会议时播放
4. **话术**：「云端 GPU 开发、本地一体机演示；生产部署走企业专线/公网 UDP」

---

## 9. 常见问题

### offer 200 但无视频 / ICE connecting

- 确认三个进程都在 **本机** 运行
- 浏览器必须用 **localhost**，不要用 AutoDL 远程 URL
- 检查 Windows 防火墙是否拦截 Python/node（首次弹窗选「允许」）
- Linly 若 HTTPS 启动，根目录 `.env` 中 `LINLY_STREAM_URL` 改为 `https://127.0.0.1:8000`

### Linly 启动报错缺模型

重新执行 `bash scripts/download_musetalk_weights.sh`，并确认 `data/avatars/musetalk_avatar1/` 存在。

### Edge TTS 403

TTS 降级失败不影响文字回复；可换 Linly 驱动或配置其他 TTS。

### 端口被占用

```powershell
netstat -ano | findstr :8010
taskkill /PID <pid> /F
```

---

## 10. 一键脚本（仅 Backend + Frontend）

Linly 仍需单独开终端（GPU 模型加载慢，不适合塞进同一脚本）。

```powershell
cd C:\Projects\ElderTalk
.\scripts\start_all.ps1
```

脚本会启动 8010 + 5173；**请先手动启动 Linly 终端 1**。

---

## 相关文档

- [docs/deploy/autodl.md](autodl.md) — 云端 GPU 开发
- [docs/webrtc-troubleshooting.md](../webrtc-troubleshooting.md) — WebRTC 排查
- [Linux指令.md](../../Linux指令.md) — Linux/AutoDL 逐步命令
- [frontend/DESIGN.md](../../frontend/DESIGN.md) — 紫色 UI 设计系统
