# AutoDL 镜像兼容性分析 + 部署计划

## 1. Linly-Talker-Stream 依赖要求

| 依赖 | 要求 | 来源 |
|------|------|------|
| Python | `>=3.10, <3.12` | pyproject.toml |
| PyTorch | `2.5.0` | pyproject.toml |
| CUDA | `12.4` | pyproject.toml (pytorch-cu124 index) |
| transformers | `4.46.0` | pyproject.toml |

## 2. AutoDL 官方镜像列表（当前可用）

来源：https://api.autodl.com/docs/base_config/

| 框架 | 框架版本 | Python | CUDA |
|------|----------|--------|------|
| PyTorch | 2.1.0 | **3.10** | **12.1** |
| PyTorch | 2.1.2 | **3.10** | 11.8 |
| PyTorch | 2.3.0 | 3.12 | 12.1 |
| PyTorch | 2.5.1 | 3.12 | 12.4 |
| PyTorch | 2.7.0 | 3.12 | 12.8 |
| PyTorch | 2.8.0 | 3.12 | 12.8 |
| Miniconda | conda3 | **3.10** | 11.8 |

## 3. 兼容性分析

### 最佳匹配：PyTorch 2.1.0 | Python 3.10 | CUDA 12.1

| 维度 | 状态 | 说明 |
|------|------|------|
| Python 3.10 | ✅ 完美 | Linly 要求 `>=3.10, <3.12` |
| CUDA 12.1 | ✅ 兼容 | 驱动向下兼容，PyTorch 2.5.0 cu124 自带 CUDA 库 |
| PyTorch 2.1.0 | ⚠️ 需升级 | setup-env.sh 的 `uv sync` 会自动升级到 2.5.0 |

### 为什么不选其他镜像

| 镜像 | 问题 |
|------|------|
| PyTorch 2.5.1 / 3.12 / 12.4 | Python 3.12 不满足 `<3.12`（MuseTalk/mmdet 不支持） |
| PyTorch 2.1.2 / 3.10 / 11.8 | CUDA 11.8 太旧，PyTorch 2.5.0 cu124 需要驱动 ≥525 |
| PyTorch 2.3.0 / 3.12 / 12.1 | Python 3.12 不兼容 |
| Miniconda / 3.10 / 11.8 | CUDA 11.8 太旧，需手动装 CUDA Toolkit |

### 结论

**唯一正确选择：`PyTorch 2.1.0 | Python 3.10 | CUDA 12.1`**

## 4. GPU 选择

| GPU | 显存 | 价格 | 可用性 | 推荐 |
|------|------|------|--------|------|
| RTX 4090 | 24GB | ~2.5元/h | 充足 | **首选** |
| RTX 4090D | 24GB | ~2.5元/h | 充足 | 备选 |
| A5000 | 24GB | ~2元/h | 较少 | 备选 |
| L40 | 48GB | ~3元/h | 较少 | 备选 |
| A100 | 40GB | ~6.5元/h | 较少 | 预算充足 |

> RTX 3090 目前在 AutoDL 基本租不到，不用考虑。

## 5. 部署步骤

### 5.1 AutoDL 创建实例

- GPU：RTX 4090
- 镜像：`PyTorch 2.1.0 | Python 3.10 | CUDA 12.1`
- 数据盘：≥50GB

### 5.2 SSH 登录后执行

```bash
# 1. 确认环境
python3.10 --version    # 应输出 3.10.x
nvidia-smi              # 确认 GPU 可用

# 2. 克隆项目
cd /root/autodl-tmp
git clone https://github.com/ShuoMeng66/3DAIAvatar.git
cd 3DAIAvatar

# 3. 安装 Linly-Talker-Stream（uv 会自动升级 PyTorch → 2.5.0 cu124）
cd third_party/Linly-Talker-Stream
bash scripts/setup-env.sh musetalk

# 4. 下载模型权重
bash scripts/download_musetalk_weights.sh

# 5. 修复端口冲突（Linly 8010 → 8000）
sed -i 's/listenport: 8010/listenport: 8000/' config/config_musetalk.yaml

# 6. 配置 ElderTalk
cd /root/autodl-tmp/3DAIAvatar
cat > .env << 'EOF'
DASHSCOPE_API_KEY=sk-你的key
TTS_ENGINE=edge-tts
TTS_VOICE=zh-CN-XiaoxiaoNeural
ASR_MODE=browser
LINLY_STREAM_URL=http://localhost:8000
BACKEND_PORT=8010
EOF

# 7. 安装 ElderTalk 后端
cd backend
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 8. 启动 Linly-Talker（GPU，端口 8000）
cd /root/autodl-tmp/3DAIAvatar/third_party/Linly-Talker-Stream
source .venv/bin/activate 2>/dev/null || true
nohup uv run python src/server/app.py --config config/config_musetalk.yaml \
    > /root/autodl-tmp/linly.log 2>&1 &

# 9. 等待 Linly 就绪（首次 30-60s）
for i in $(seq 1 12); do
    sleep 10
    curl -s http://localhost:8000/health && break
    echo "等待中... $((i*10))s"
done

# 10. 启动 ElderTalk 后端（CPU，端口 8010）
cd /root/autodl-tmp/3DAIAvatar/backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8010 \
    > /root/autodl-tmp/backend.log 2>&1 &

sleep 3
curl -s http://localhost:8010/health && echo "OK"
```

### 5.3 全息仓 PC 端

```bash
# SSH 隧道
ssh -L 8010:localhost:8010 -L 8000:localhost:8000 -p SSH端口 root@AutoDL机器IP

# 前端
git clone https://github.com/ShuoMeng66/3DAIAvatar.git
cd 3DAIAvatar/frontend
npm install
VITE_API_BASE=http://localhost:8010 npm run dev -- --host 0.0.0.0

# 副屏 kiosk
google-chrome --kiosk --window-position=1920,0 --window-size=1440,2560 \
    --app=http://localhost:5173/#/cabinet
```

## 6. 验证

- [ ] `nvidia-smi` 显示 RTX 4090
- [ ] `python3.10 --version` 输出 3.10.x
- [ ] `uv run python -c "import torch; print(torch.__version__)"` 输出 2.5.0+cu124
- [ ] `curl localhost:8000/health` 返回 OK
- [ ] `curl localhost:8010/health` 返回 OK
- [ ] PC 端隧道连通，前端可访问