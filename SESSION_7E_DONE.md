# SESSION_7E_DONE.md — 全息仓控制面板 + 双屏部署 + 文档

## 完成时间

2026-06-24

## 目标

Session 7 收尾：改造 HologramPage 为全息仓控制面板、编写一键部署脚本、完善三份文档。

## 新增文件

| 文件 | 说明 |
|------|------|
| `scripts/start_cabinet.ps1` | Windows 一键启动脚本（backend + frontend + 主屏 + 副屏命令） |
| `scripts/start_cabinet.sh` | Linux/macOS 一键启动脚本 |
| `SESSION_7E_DONE.md` | 本文件 |
| `SESSION_7_DONE.md` | Session 7 全系列汇总 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `frontend/src/pages/HologramPage.tsx` | 重构：左栏 /chat 预览 + 右栏 /cabinet 9:16 预览 + 按钮 + LED 折叠区 |
| `HOLOGRAM_CABINET.md` | 新增双屏部署步骤、故障排查（5 个场景）、与 LED 风扇对比表、状态更新 |
| `HOLOGRAM.md` | 顶部添加警告框，指向全息仓文档，注明不需要 converter |
| `README.md` | 新增 FAQ（全息仓 vs LED 风扇）、更新目录结构 |

## 技术细节

### HologramPage 控制面板
- 左栏 60%：`<iframe src="/#/chat">` 预览控制端
- 右栏 40%：`<iframe src="/#/cabinet">` 预览展示端（9:16 黑框，maxWidth 400px）
- 「新窗口打开展示页」：`window.open('/#/cabinet', '_blank', 'width=1440,height=2560')`
- 「复制副屏启动命令」：`navigator.clipboard.writeText` + toast 提示
- 折叠区「高级 / LED 风扇模式」：保留原有 LED 风扇说明，明确区分两种全息方案

### 部署脚本
- **Windows**：`Start-Job` 后台启动 backend + frontend，轮询 health check，`Start-Process` 打开主屏
- **Linux**：`&` 后台启动，`curl` 轮询 health check，`xdg-open`/`open` 打开主屏
- 两者均打印 Chrome kiosk 副屏命令

### 文档更新
- **HOLOGRAM_CABINET.md**：双屏部署 5 步（硬件连接 → 一键启动 → 副屏启动 → 手动启动）、故障排查 5 个场景
- **HOLOGRAM.md**：顶部警告框 + 「全息仓不需要 converter」
- **README.md**：FAQ 新增全息仓 vs LED 风扇对比 + 目录结构更新

## 验收结果

- [x] TypeScript 编译零错误
- [x] 控制面板 `/hologram` 双栏预览 + 按钮可用
- [x] `start_cabinet.ps1` 和 `start_cabinet.sh` 脚本完整
- [x] HOLOGRAM_CABINET.md 双屏步骤 + 故障排查完整
- [x] HOLOGRAM.md 顶部警告框存在
- [x] README.md FAQ + 目录结构更新
- [x] 不删除 hologram/ 模块

## 约束遵守

- [x] 不删 hologram/ LED 风扇模块
- [x] 文档明确全息仓不需要 `python -m hologram.converter`
- [x] 原有 LED 风扇功能保留在折叠区内