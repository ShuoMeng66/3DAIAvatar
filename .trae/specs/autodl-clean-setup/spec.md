# AutoDL 干净环境重装 Spec

## Why
前序安装过程混乱——`.venv`、conda、`source activate` 环境切换导致依赖装到了不同位置，终端前缀 `(Linly-Talker-Stream)` 误导判断。base 环境实际上已有大部分包，需要**清理混乱、验证已有、补全缺失**，而不是从零重装。

## What Changes
- 清除所有残留的 `.venv` 目录
- 直接用 base 环境 Python（`/root/miniconda3/bin/python3.10`），不创建任何虚拟环境
- 验证已有包，仅补装缺失项
- 用 `pip` 代替 `uv`，避免环境混淆
- 端口修复 + 配置 .env + 启动服务

## Impact
- Affected specs: none（纯运维操作，不改代码）
- Affected code: none

## 关键原则
1. **不 source activate 任何东西** — 终端前缀勿管
2. **不创建 .venv** — 直接用 base
3. **用 `pip` 不用 `uv`** — 避免环境隔离问题
4. **先验证再装** — 避免重复下载

## ADDED Requirements
### Requirement: 干净环境部署
系统 SHALL 在 AutoDL base 环境中完成 Linly-Talker + ElderTalk 完整部署。

#### Scenario: 验证已有依赖
- **WHEN** 执行 `python3 -c "import torch; print(torch.__version__)"`
- **THEN** 输出 `2.5.0+cu124` 或提示缺失，仅补装缺失项

#### Scenario: 启动 Linly-Talker
- **WHEN** 执行启动命令
- **THEN** `curl localhost:8000/health` 返回 OK

#### Scenario: 启动 ElderTalk 后端
- **WHEN** 执行启动命令
- **THEN** `curl localhost:8010/health` 返回 OK