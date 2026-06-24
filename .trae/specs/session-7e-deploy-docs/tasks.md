# Tasks: Session 7E — 全息仓控制面板 + 双屏部署 + 文档

- [x] Task 1: 重构 `frontend/src/pages/HologramPage.tsx` 为全息仓控制面板
  - [x] 左栏：`<iframe src="/#/chat">` 预览（约 60% 宽度）
  - [x] 右栏：`<iframe src="/#/cabinet">` 预览（9:16 黑框，约 40% 宽度）
  - [x] 按钮栏：「新窗口打开展示页」→ `window.open`
  - [x] 按钮栏：「复制副屏启动命令」→ `navigator.clipboard.writeText` + toast
  - [x] 折叠区「高级 / LED 风扇模式」：保留原有 512 分辨率、TF 卡、设备 IP 相关 UI
  - [x] 保留原有 LED 风扇 MP4 导出功能（折叠区内）
  - **验证**：TypeScript 编译通过

- [x] Task 2: 创建 `scripts/start_cabinet.ps1`（Windows）
  - [x] 启动 backend：`Start-Job` + `uvicorn main:app --host 0.0.0.0 --port 8010`
  - [x] 启动 frontend：`Start-Job` + `npm run dev -- --host 0.0.0.0`
  - [x] 等待服务就绪（轮询 health check）
  - [x] 主屏打开 `http://localhost:5173/#/chat`
  - [x] 打印 Chrome kiosk 副屏命令
  - **验证**：脚本语法正确

- [x] Task 3: 创建 `scripts/start_cabinet.sh`（Linux/macOS）
  - [x] 启动 backend：`uvicorn main:app --host 0.0.0.0 --port 8010 &`
  - [x] 启动 frontend：`npm run dev -- --host 0.0.0.0 &`
  - [x] 等待服务就绪
  - [x] 主屏打开 URL
  - [x] 打印 Chrome kiosk 副屏命令
  - **验证**：脚本语法正确

- [x] Task 4: 完善 `HOLOGRAM_CABINET.md`
  - [x] 双屏架构成品（移除"占位"标记）
  - [x] 双屏部署步骤：扩展桌面 → 启动脚本 → Chrome kiosk
  - [x] 故障排查章节：黑屏/白屏/副屏无显示/音频问题
  - [x] 更新后续计划 checklist（标记已完成项）
  - **验证**：文档格式正确

- [x] Task 5: 修改 `HOLOGRAM.md` 顶部加警告
  - [x] 顶部添加警告框：「本文档仅 LED 风扇，全息仓见 HOLOGRAM_CABINET.md」
  - [x] 注明全息仓不需要 `python -m hologram.converter`
  - **验证**：文档格式正确

- [x] Task 6: 修改 `README.md` 增加 FAQ
  - [x] FAQ 新增：「全息仓和 LED 风扇屏有什么区别？」
  - [x] 链接到 HOLOGRAM_CABINET.md
  - [x] 更新目录结构，反映 7A–7D 新增文件
  - **验证**：文档格式正确

- [x] Task 7: 创建 `SESSION_7E_DONE.md`
  - [x] 记录新增/修改文件
  - [x] 记录验收结果
  - **验证**：完成

- [x] Task 8: 创建 `SESSION_7_DONE.md`（全系列汇总）
  - [x] 汇总 7A–7E 各阶段产出
  - [x] 列出已知限制
  - [x] 建议 Session 8 方向
  - **验证**：完成

- [x] Task 9: TypeScript 编译验证
  - [x] `npx tsc --noEmit` 零错误
  - **验证**：通过

# Task Dependencies
- Task 1 独立
- Task 2 独立
- Task 3 独立
- Task 4 独立
- Task 5 独立
- Task 6 独立
- Task 7 依赖 Task 1-6 完成
- Task 8 依赖 Task 7 完成
- Task 9 依赖 Task 1 完成