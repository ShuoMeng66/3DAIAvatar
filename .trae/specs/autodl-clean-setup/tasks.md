# Tasks

- [ ] Task 1: 清理残留
  - [ ] 删除所有 `.venv` 目录：`rm -rf third_party/Linly-Talker-Stream/.venv`
  - [ ] 确认 Python 路径：`which python3` 应为 `/root/miniconda3/bin/python3`
  - **验证**：`python3 --version` 输出 3.10.x

- [ ] Task 2: 验证已有依赖 + 补装缺失
  - [ ] 执行验证脚本，列出所有 ✅/❌
  - [ ] 全部 ❌ → 说明之前装到了已删除的 .venv 里，执行 Task 2A 全量重装
  - [ ] 部分 ❌ → 仅补装缺失项
  - **验证**：所有包 ✅

- [ ] Task 2A: 全量重装（仅当 Task 2 全部 ❌ 时执行）
  - [ ] `pip install torch==2.5.0 torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124 -i https://pypi.tuna.tsinghua.edu.cn/simple/`
  - [ ] `pip install -e . --no-build-isolation -i https://pypi.tuna.tsinghua.edu.cn/simple/`
  - [ ] `pip install chumpy==0.70 --no-build-isolation`
  - [ ] `pip install -e src/avatars/musetalk/ -i https://mirrors.aliyun.com/pypi/simple/`
  - [ ] `pip install mmcv==2.2.0 -f https://mirrors.aliyun.com/openmmlab/mmcv/dist/cu124/torch2.5/index.html -i https://mirrors.aliyun.com/pypi/simple/ --timeout 300`
  - [ ] `pip install mmdet==3.1.0 mmpose==1.3.2 -i https://pypi.tuna.tsinghua.edu.cn/simple/`
  - [ ] `bash scripts/post_musetalk_install.sh`
  - **验证**：所有核心包 import 成功

- [ ] Task 3: 修复端口 + 配置 .env
  - [ ] `sed -i 's/listenport: 8010/listenport: 8000/' config/config_musetalk.yaml`
  - [ ] 创建 `.env` 填入 DASHSCOPE_API_KEY + LINLY_STREAM_URL
  - **验证**：`cat .env` 内容正确

- [ ] Task 4: 启动 Linly-Talker（端口 8000）
  - [ ] `nohup python3 -m uvicorn src.server.app:app --host 0.0.0.0 --port 8000 --config config/config_musetalk.yaml > /root/autodl-tmp/linly.log 2>&1 &`
  - [ ] 等待就绪：轮询 `curl localhost:8000/health`
  - **验证**：`curl localhost:8000/health` 返回 OK

- [ ] Task 5: 安装 ElderTalk 后端 + 启动（端口 8010）
  - [ ] `cd backend && pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/`
  - [ ] `nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8010 > /root/autodl-tmp/backend.log 2>&1 &`
  - **验证**：`curl localhost:8010/health` 返回 OK

- [ ] Task 6: 最终验证
  - **验证**：`python3 -c "import torch; print(torch.cuda.is_available())"` 输出 True
  - **验证**：`curl localhost:8000/health` OK
  - **验证**：`curl localhost:8010/health` OK

# Task Dependencies
- Task 2 依赖 Task 1
- Task 2A 依赖 Task 2（仅当全部 ❌）
- Task 3 依赖 Task 2 或 Task 2A
- Task 4 依赖 Task 3
- Task 5 依赖 Task 3
- Task 6 依赖 Task 4, Task 5