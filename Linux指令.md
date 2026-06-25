# ElderTalk / 颐语 — Linux 服务器部署指令（AutoDL）

> **照着做、逐步验收。** 本文只写「在哪里操作 → 命令 → 必须看到什么 → 失败怎么办」。  
> 网络原理见 [docs/deploy/autodl.md](docs/deploy/autodl.md)；WebRTC 深度排查见 [docs/webrtc-troubleshooting.md](docs/webrtc-troubleshooting.md)。

---

## 0. 使用前必读

### 0.1 三进程模型（缺一不可）

| 进程 | 端口 | 作用 |
|------|------|------|
| Linly-Talker-Stream | **8000** | 数字人 GPU 推理 + WebRTC 媒体（UDP） |
| ElderTalk Backend | **8010** | API 网关、/offer 信令代理 |
| ElderTalk Frontend | **5173** | Vite 开发服务器 / 浏览器入口 |

启动顺序：**Linly → Backend → Frontend**。

### 0.2 终端命名（后面步骤会反复提到）

| 名称 | 何时用 | 能否关闭 |
|------|--------|----------|
| **Setup 终端** | 首次安装、写配置、跑自检 | 安装完成后可关 |
| **终端 1** | 只跑 Linly | **不能关**（关了就没视频） |
| **终端 2** | 只跑 Backend | **不能关** |
| **终端 3** | 只跑 Frontend | **不能关** |
| **验收终端** | 临时 curl / 自检脚本 | 用完可关 |

> 在 AutoDL 或任意 SSH 客户端里：**每开一个「新连接 / 新标签页」= 一个新终端**。  
> 下面写「新开终端 2」= 再 SSH 登录一次，或点「新建终端」。

### 0.3 环境隔离铁律（避免装一下午）

| 组件 | 用什么 Python | 禁止事项 |
|------|---------------|----------|
| **Linly** | `third_party/Linly-Talker-Stream/.venv` 内，用 **`uv run`** | 不要用 base `python` 直接跑 Linly |
| **Backend** | base 环境 **`python3.10` + `pip`** | **禁止** `source activate` 任何 conda/venv 后再启 backend |
| **Frontend** | 系统 `node` / `npm` | 与 Python 环境无关 |

判断当前 Python 是否正确：

```bash
# Backend 启动前应在 backend 目录执行：
which python3.10
# 期望：/root/miniconda3/bin/python3.10（或类似 base 路径，不是 Linly/.venv）

python3.10 -c "import fastapi; print('backend deps OK')"
```

终端提示符出现 `(Linly-Talker-Stream)` **可以忽略**，以 `which python3.10` 为准。

### 0.4 WebRTC 铁律

- 浏览器必须用 AutoDL **公网 URL** 访问前端（5173 映射地址）。
- SSH `-L 8010:localhost:8010` **只能**调试 API，**不能**传 WebRTC 视频。
- 数字人视频走 **UDP 8000**，必须在 AutoDL 控制台映射 **8000（UDP+TCP）**。

### 0.5 健康检查路径（别写错）

| 服务 | 正确路径 | 错误示例 |
|------|----------|----------|
| Backend | `http://localhost:8010/health` | ~~`/api/v1/health`~~ |
| Linly | `http://localhost:8000/health` | — |

### 0.6 项目根路径约定

下文默认项目在：

```text
/root/autodl-tmp/ElderTalk
```

若你 clone 到其他目录，后续所有 `cd` 自行替换。

---

## 第一部分：AutoDL 控制台（浏览器，不是 SSH）

### 步骤 A1 — 创建实例

**在哪里操作：** 本机浏览器 → [AutoDL 控制台](https://www.autodl.com/) → 租用实例

**做什么：** 选对 GPU 和镜像，避免 Python/CUDA 不兼容。

**配置项：**

| 项 | 必选值 |
|----|--------|
| GPU | **RTX 4090**（24GB 显存） |
| 镜像 | **PyTorch 2.1.0 \| Python 3.10 \| CUDA 12.1** |
| 数据盘 | **≥ 50GB** |

**验收（必须看到）：** 实例状态为「运行中」，可点击「SSH 连接」或复制 SSH 命令。

**若失败：** Python 3.12 镜像会导致 Linly 依赖报错 — 换 **3.10** 镜像重建实例。

---

### 步骤 A2 — 映射端口

**在哪里操作：** AutoDL 控制台 → 你的实例 → **自定义服务** / **端口映射**

**做什么：** 让外网浏览器能访问三个端口；**8000 必须含 UDP**。

**添加映射：**

| 容器内端口 | 协议 | 用途 |
|------------|------|------|
| 8000 | **TCP + UDP** | Linly WebRTC |
| 8010 | TCP | ElderTalk API |
| 5173 | TCP | 前端 Vite |

**验收（必须看到）：** 控制台为每个端口显示一条 **公网访问 URL**（形如 `https://region-xx.autodl.com:xxxxx`）。

**若失败：** 没有 UDP 8000 → 后面会出现「offer 200 但无画面」。

---

### 步骤 A3 — 记录公网 URL

**在哪里操作：** 本机记事本

**做什么：** 后面写 `.env` 和 `frontend/.env` 要用。

**记下这三条（把示例换成你控制台里的真实地址）：**

```text
LINLY_PUBLIC=   https://region-xx.autodl.com:12345    # 8000 映射
API_PUBLIC=     https://region-xx.autodl.com:23456    # 8010 映射
FRONTEND_PUBLIC=https://region-xx.autodl.com:34567    # 5173 映射
```

---

## 第二部分：Setup 终端 — 一次性安装

> 下面所有步骤在 **同一个 SSH 连接（Setup 终端）** 里顺序执行，除非步骤标题写了「新开终端」。

---

### 步骤 0 — SSH 登录

**在哪里操作：** AutoDL 控制台 → 「SSH 连接」→ 复制命令；或本机终端 / MobaXterm / VS Code Remote

**做什么：** 登录到 GPU 服务器。

**命令：**

```bash
ssh -p <端口> root@<AutoDL-IP>
```

**验收（必须看到）：** 提示符类似 `root@autodl-container-xxxxx:~#`

**若失败：** 实例未启动 → 回控制台点「开机」。

---

### 步骤 1 — 环境自检

**在哪里操作：** Setup 终端

**做什么：** 确认 Python、GPU、磁盘可用。

**命令：**

```bash
python3.10 --version
nvidia-smi
df -h /root/autodl-tmp
```

**验收（必须看到）：**

```text
Python 3.10.x
nvidia-smi 表格中有 RTX 4090，Memory 约 24GB
/root/autodl-tmp 可用空间 ≥ 30GB
```

**若失败：**

- 无 `python3.10` → 镜像选错，重建实例（见 A1）。
- `nvidia-smi` 报错 → 实例 GPU 未挂载，重启实例或换区。

---

### 步骤 2 — 清理残留环境（可选）

**在哪里操作：** Setup 终端

**做什么：** 若之前装乱过（多个 `.venv`、`conda activate` 混用），先清 Linly 虚拟环境再重装。

**何时需要：** 第一次部署可 **跳过**；若 `setup-env.sh` 或 `uv run` 报奇怪依赖错误，再执行。

**命令：**

```bash
cd /root/autodl-tmp
# 若已有旧目录且想重来：
# rm -rf ElderTalk

# 若 Linly .venv 已损坏：
rm -rf ElderTalk/third_party/Linly-Talker-Stream/.venv 2>/dev/null || true
```

**验收：** 无报错即可。

**若失败：** `Permission denied` → 加 `sudo` 或确认在 `/root/autodl-tmp` 下有写权限。

---

### 步骤 3 — 克隆 ElderTalk

**在哪里操作：** Setup 终端

**做什么：** 拉取项目代码。

**命令：**

```bash
cd /root/autodl-tmp
git clone https://github.com/ShuoMeng66/ElderTalk.git
cd ElderTalk
ls -la
```

**验收（必须看到）：** 目录下有 `backend/`、`frontend/`、`third_party/Linly-Talker-Stream/`、`scripts/`。

**若失败：**

- `third_party/Linly-Talker-Stream` 为空 → 仓库未完整 clone，执行 `git pull` 或重新 clone。
- 网络超时 → 多试几次，或使用 AutoDL 自带 git 加速。

---

### 步骤 4 — 安装 Linly 环境

**在哪里操作：** Setup 终端

**做什么：** 安装 MuseTalk 所需 Python 依赖（耗时 **10–30 分钟**）。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/third_party/Linly-Talker-Stream
bash scripts/setup-env.sh musetalk
```

**验收（必须看到）：** 脚本末尾无 `ERROR`；且：

```bash
uv run python -c "import torch; print(torch.__version__)"
# 期望类似：2.5.0+cu124
```

**若失败：**

- `uv: command not found` → 脚本一般会装 uv；若仍失败：`pip install uv` 后重跑。
- CUDA 相关报错 → 确认步骤 1 的镜像为 **CUDA 12.1 + Python 3.10**。

---

### 步骤 5 — 下载 MuseTalk 模型权重

**在哪里操作：** Setup 终端（仍在 Linly 目录）

**做什么：** 下载唇形同步等模型（耗时 **20–60 分钟**，视网络而定）。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/third_party/Linly-Talker-Stream
export HF_ENDPOINT=https://hf-mirror.com
bash scripts/download_musetalk_weights.sh
```

**验收（必须看到）：**

```bash
ls models/musetalk/musetalkV15 | head -3
# 应列出若干 .pth / .bin 等文件，非空目录
```

**若失败：**

- HuggingFace 超时 → 确认已 `export HF_ENDPOINT=https://hf-mirror.com` 后重跑脚本。
- 磁盘满 → `df -h`，扩容数据盘或删无用文件。

---

### 步骤 6 — 修改 Linly 监听端口为 8000

**在哪里操作：** Setup 终端（Linly 目录）

**做什么：** 默认配置是 8010，与 Backend 冲突；**必须改为 8000**。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/third_party/Linly-Talker-Stream
sed -i 's/listenport: 8010/listenport: 8000/' config/config_musetalk.yaml
grep listenport config/config_musetalk.yaml
```

**验收（必须看到）：**

```text
  listenport: 8000
```

**若失败：** 仍显示 `8010` → 手动编辑 `config/config_musetalk.yaml`，把 `listenport` 改成 `8000`。

---

### 步骤 7 — 安装 Backend 依赖

**在哪里操作：** Setup 终端

**做什么：** 在 **base** 环境安装 FastAPI 等（不要用 Linly 的 venv）。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk
pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
python3.10 -c "import fastapi, uvicorn, httpx; print('backend deps OK')"
```

**验收（必须看到）：** 输出 `backend deps OK`。

**若失败：**

- `ModuleNotFoundError` → 确认 **没有** 执行过 `source activate` / `conda activate`，再重跑 pip。
- pip 很慢 → 保留 `-i https://pypi.tuna.tsinghua.edu.cn/simple`。

---

### 步骤 8 — 安装 Frontend 依赖

**在哪里操作：** Setup 终端

**做什么：** 安装 Node 依赖。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/frontend
npm install
```

**验收（必须看到）：** 生成 `node_modules/`，无 `npm ERR!` 结尾。

**若失败：** Node 版本过旧 → `node -v` 建议 ≥ 18；AutoDL PyTorch 镜像一般自带较新 Node。

---

### 步骤 9 — 配置根目录 `.env`

**在哪里操作：** Setup 终端

**做什么：** 配置 LLM 与 Linly 内网地址。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk
cp .env.example .env
nano .env
```

**`.env` 最少填写（把 sk-xxx 换成真实 Key）：**

```env
LLM_API_KEY=sk-your-real-key-here
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

LINLY_STREAM_URL=http://127.0.0.1:8000
PORT=8010

# 用步骤 A3 记下的 FRONTEND_PUBLIC（5173 公网 URL，不要末尾斜杠）
FRONTEND_ORIGIN=https://region-xx.autodl.com:34567
```

**验收：**

```bash
grep -E '^LLM_API_KEY=|^LINLY_STREAM_URL=|^FRONTEND_ORIGIN=' .env
# LLM_API_KEY 不能仍是 sk-your-api-key-here
# LINLY_STREAM_URL 必须是 http://127.0.0.1:8000
```

**若失败：** 忘记 Key → 去百炼 / DeepSeek 控制台复制；`FRONTEND_ORIGIN` 错会导致浏览器 CORS 报错。

---

### 步骤 10 — 配置 `frontend/.env`

**在哪里操作：** Setup 终端

**做什么：** 浏览器在 PC 上访问时，前端 JS 需要知道 **公网 API 地址**。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/frontend
cp .env.example .env
nano .env
```

**方案 A（全栈 AutoDL，推荐）— 填入步骤 A3 的公网地址：**

```env
VITE_API_BASE=https://region-xx.autodl.com:23456
VITE_LINLY_PUBLIC_URL=https://region-xx.autodl.com:12345
VITE_CABINET_MODE=2d
VITE_KIOSK_CHROME=false
```

**验收：**

```bash
grep VITE_ .env
```

**若失败：** 仍用 `localhost:8010` 且从 PC 浏览器访问 → API 请求会打到 PC 本机，必然失败；改为 **8010 公网 URL**。

---

### 步骤 11 — 确认配置一致性

**在哪里操作：** Setup 终端

**做什么：** 启动前最后一次核对，避免低级错误。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk

echo "=== Linly port ==="
grep listenport third_party/Linly-Talker-Stream/config/config_musetalk.yaml

echo "=== Backend .env ==="
grep -E 'LINLY_STREAM_URL|FRONTEND_ORIGIN|LLM_API_KEY' .env | sed 's/LLM_API_KEY=sk-.*/LLM_API_KEY=sk-***/'

echo "=== Frontend .env ==="
cat frontend/.env
```

**验收（必须看到）：** `listenport: 8000`；`LINLY_STREAM_URL=http://127.0.0.1:8000`；`FRONTEND_ORIGIN` 与 5173 公网一致；`VITE_API_BASE` 与 8010 公网一致。

**Setup 终端安装部分到此结束。** 下面进入日常启动（需要 **3 个新终端**）。

---

## 第三部分：日常启动 — 三个 SSH 终端

> **重要：** 下面 1、2、3 各占用 **一个独立 SSH 连接**。  
> 在 AutoDL Jupyter/终端页：点 **「新建」** 三次，或本机开三个 SSH 窗口。

---

### 终端 1 — 启动 Linly（端口 8000）

**在哪里操作：** **新开 SSH 连接 → 终端 1**（与 Setup 终端分开）

**做什么：** 启动 GPU 数字人引擎；**保持此窗口开着**。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/third_party/Linly-Talker-Stream
uv run python src/server/app.py --config config/config_musetalk.yaml
```

**验收（在「验收终端」或 Setup 终端执行，不要关终端 1）：**

```bash
# 首次启动需等 30–60 秒模型加载
for i in $(seq 1 18); do
  sleep 5
  if curl -sf http://localhost:8000/health; then
    echo ""
    echo "Linly OK"
    break
  fi
  echo "等待 Linly... ($i/18)"
done
```

**必须看到：** `curl` 返回内容含 **OK** 或成功 JSON；终端 1 日志出现 listening / Uvicorn / 8000 字样。

**若失败：**

| 现象 | 处理 |
|------|------|
| `Address already in use` | `lsof -i:8000` 查 PID，`kill <PID>` 后重启 |
| 一直无 `/health` | 看终端 1 日志最后 20 行；多为模型路径错 → 重跑步骤 5 |
| CUDA OOM | `nvidia-smi` 看是否已有 Linly 进程；只保留一个 Linly |

---

### 终端 2 — 启动 Backend（端口 8010）

**在哪里操作：** **再新开 SSH 连接 → 终端 2**

**前置条件：** 终端 1 的 `curl localhost:8000/health` 已通过。

**做什么：** 启动 API 网关。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/backend
python3.10 -m uvicorn main:app --host 0.0.0.0 --port 8010
```

**验收（验收终端）：**

```bash
curl -s http://localhost:8010/health
```

**必须看到：**

```json
{"status":"ok","service":"ElderTalk API"}
```

**再验 Linly 联动：**

```bash
curl -s http://localhost:8010/health/full
```

**必须看到：** `"linly": true`（或类似 true 值）。

**若失败：**

| 现象 | 处理 |
|------|------|
| `ModuleNotFoundError: fastapi` | 回 Setup 终端重跑步骤 7 |
| `health/full` 里 linly 为 false | 终端 1 未就绪或 `LINLY_STREAM_URL` 不是 `127.0.0.1:8000` |
| 端口占用 | `lsof -i:8010` → `kill` 后重启 |

---

### 终端 3 — 启动 Frontend（端口 5173）

**在哪里操作：** **再新开 SSH 连接 → 终端 3**

**前置条件：** 终端 2 的 `/health` 已通过。

**做什么：** 启动 Vite 开发服务器。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk/frontend
npm run dev -- --host 0.0.0.0
```

**验收（必须看到）：** 终端 3 输出类似：

```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
```

**若失败：**

| 现象 | 处理 |
|------|------|
| `npm: command not found` | `which npm`；AutoDL 镜像一般自带 |
| 5173 占用 | `lsof -i:5173` → `kill` 后重启 |
| 改了 `frontend/.env` 不生效 | **Ctrl+C 停掉** 终端 3，重新 `npm run dev` |

---

## 第四部分：全量自检

**在哪里操作：** 任意空闲 SSH 终端（Setup 或新建「验收终端」均可）

**做什么：** 一键检查三服务是否就绪。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk
chmod +x scripts/check_webrtc.sh
./scripts/check_webrtc.sh
```

**必须看到：**

```text
[OK] Backend /health
[OK] Linly /health
[OK] Backend /health/full
信令层就绪。若浏览器仍无画面，请检查：
  1. AutoDL 是否映射 UDP 8000（SSH 隧道不能传视频）
  ...
```

**若出现 `[FAIL]`：** 按提示先修对应服务，**不要**先开浏览器。

---

## 第五部分：浏览器访问（本机 PC）

**在哪里操作：** 本机 PC 的 Chrome / Edge（**不是** SSH 终端）

**做什么：** 用 **AutoDL 5173 公网 URL** 打开聊天页。

**地址：**

```text
https://region-xx.autodl.com:34567/#/chat
```

（使用步骤 A3 的 `FRONTEND_PUBLIC`，后缀 `/#/chat`）

**必须看到（约 10 秒内）：**

1. 页面加载正常，无 CORS 红字（F12 → Console）
2. 数字人区域出现 **视频画面**（非永久黑屏）
3. 连接状态为 connected / 已连接

**全息仓竖屏页：**

```text
https://region-xx.autodl.com:34567/#/cabinet
```

**禁止：**

- 仅用 `ssh -L 5173:localhost:5173` 然后在浏览器开 `localhost:5173` 期望 WebRTC 有画面 — **视频不会通**。
- 只用 SSH 隧道访问、却未映射 UDP 8000。

**若 offer 200 仍无画面 — 快速决策树：**

```text
F12 → Network → POST /offer 是否 200？
├─ 否 → 终端 1/2 是否运行？./scripts/check_webrtc.sh
└─ 是 → chrome://webrtc-internals
    ├─ ICE = failed / disconnected → 回控制台检查 8000 UDP 映射
    ├─ ICE = connected 但无画面 → 刷新 /#/chat；确认 VITE_CABINET_MODE=2d
    └─ 有 video track 但黑屏 → 换 Chrome；看终端 1 Linly 是否报错
```

详细说明：[docs/webrtc-troubleshooting.md](docs/webrtc-troubleshooting.md)

---

## 第六部分：停止与重启

### 6.1 正常停止

**在哪里操作：** 终端 1、2、3 各自窗口

**命令：** 每个终端按 **`Ctrl + C`** 一次，等进程退出。

**顺序建议：** 终端 3（Frontend）→ 终端 2（Backend）→ 终端 1（Linly）

---

### 6.2 强制按端口杀进程

**在哪里操作：** 任意 SSH 终端

**何时用：** 终端已关但端口仍被占用。

**命令：**

```bash
# 查看占用
lsof -i:8000 -i:8010 -i:5173

# 强制释放（确认无重要进程后再执行）
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 8010/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
```

**验收：**

```bash
curl -sf http://localhost:8000/health && echo "8000 still up" || echo "8000 down"
curl -sf http://localhost:8010/health && echo "8010 still up" || echo "8010 down"
```

---

### 6.3 日常重启流程（第二次及以后）

1. **终端 1** 启动 Linly → 等 `/health` OK  
2. **终端 2** 启动 Backend → 等 `/health` OK  
3. **终端 3** 启动 Frontend  
4. `./scripts/check_webrtc.sh`  
5. 浏览器打开公网 `/#/chat`

**无需重复：** 步骤 4–11（除非换镜像、删盘、升级依赖）。

---

### 6.4 可选：后台一键启动（熟练后再用）

**在哪里操作：** Setup 终端

**做什么：** 用脚本后台拉起（调试阶段 **不推荐**，日志不直观）。

**命令：**

```bash
cd /root/autodl-tmp/ElderTalk
./scripts/start_all.sh
tail -f linly.log backend.log frontend.log
```

**说明：** `start_all.sh` 假设 Linly 已安装；首次请用 **三终端前台** 方式。

---

## 第七部分：常见错误速查表

| 症状 | 根因 | 修复（只做这一条） |
|------|------|-------------------|
| offer 200，浏览器无视频 | UDP 8000 未映射 | AutoDL 控制台给 8000 开 **UDP+TCP** |
| `check_webrtc` Linly FAIL | 终端 1 未启或端口错 | 启 Linly；`grep listenport` 必须是 8000 |
| 浏览器 CORS 错误 | `FRONTEND_ORIGIN` 与访问 URL 不一致 | `.env` 改为 5173 **公网** URL，重启 Backend |
| API 请求 localhost 失败 | `VITE_API_BASE` 仍是 localhost | 改 `frontend/.env` 为 8010 公网 URL，重启 Frontend |
| Backend `ModuleNotFoundError` | 在 Linly venv 里装了包 | 退出 activate；用 `python3.10 -m pip install -r backend/requirements.txt` |
| Linly 依赖混乱 | 多次混用 conda/uv/pip | 步骤 2 删 `.venv` 后重跑步骤 4–5 |
| 模型下载失败 | HuggingFace 直连超时 | `export HF_ENDPOINT=https://hf-mirror.com` 后重跑下载脚本 |
| `/offer` 503 | Linly 未就绪 | 等终端 1 日志稳定后再开 Frontend |
| 对话无口型 | WebRTC 未 connected | 先修视频；在 `/#/chat` 发消息测试 |
| `health/full` linly false | `LINLY_STREAM_URL` 错误 | 必须是 `http://127.0.0.1:8000` |
| 改了 `.env` 不生效 | 未重启对应进程 | 改 backend 配置 → 重启终端 2；改 frontend → 重启终端 3 |

---

## 附录 A：方案 B — PC 本地前端 + AutoDL GPU 后端

**适用：** 前端在你 PC 跑，Linly + Backend 在 AutoDL。

### B1 — AutoDL 只映射 8000 + 8010

同第一部分 A2，**可不映射 5173**。

### B2 — AutoDL 上只启终端 1 + 终端 2

按第三部分启动 Linly 和 Backend，**不启终端 3**。

### B3 — PC 上配置并启动前端

**在哪里操作：** 本机 PC 终端

```bash
git clone https://github.com/ShuoMeng66/ElderTalk.git
cd ElderTalk/frontend
npm install
cp .env.example .env
```

**`frontend/.env`：**

```env
VITE_API_BASE=http://localhost:8010
VITE_LINLY_PUBLIC_URL=https://region-xx.autodl.com:12345
VITE_CABINET_MODE=2d
```

**可选 SSH 隧道（仅 API，不传视频）：**

```bash
ssh -L 8010:localhost:8010 -p <端口> root@<AutoDL-IP>
```

**启动：**

```bash
npm run dev
```

浏览器：`http://localhost:5173/#/chat`  
WebRTC 媒体仍走 AutoDL **公网 8000（UDP）**。

---

## 附录 B：相关文档

| 文档 | 内容 |
|------|------|
| [docs/deploy/autodl.md](docs/deploy/autodl.md) | 方案 A/B 架构、UDP vs SSH |
| [docs/webrtc-troubleshooting.md](docs/webrtc-troubleshooting.md) | WebRTC / SDP / ICE 深度排查 |
| [HOLOGRAM_CABINET.md](HOLOGRAM_CABINET.md) | 全息仓硬件与 kiosk 启动 |
| [README.md](README.md) | 项目总览与 QuickStart |

---

## 附录 C：每日检查清单（打印可勾选）

```text
[ ] AutoDL 实例运行中，8000/8010/5173 已映射（8000 含 UDP）
[ ] 终端 1：Linly 前台运行，curl localhost:8000/health OK
[ ] 终端 2：Backend 运行，curl localhost:8010/health OK
[ ] 终端 3：Frontend 运行，5173 可访问
[ ] ./scripts/check_webrtc.sh 全部 OK
[ ] 浏览器用 5173 公网 URL 打开 /#/chat，10 秒内有视频
[ ] 发送一条文字，数字人有口型/声音
```

全部勾选后，部署完成。
