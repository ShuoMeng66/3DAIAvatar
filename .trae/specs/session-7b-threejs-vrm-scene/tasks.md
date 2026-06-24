# Tasks: Session 7B — Three.js 黑底 3D 场景 + VRM 全身角色

- [x] Task 1: 安装 Three.js 依赖
  - [x] 安装 `three`、`@types/three`、`@pixiv/three-vrm`
  - [x] 验证 `package.json` 中依赖已添加
  - **验证**：`npx tsc --noEmit` 通过

- [x] Task 2: 创建 CabinetScene.ts 场景管理器
  - [x] 初始化 `Scene`，设置 `scene.background = new Color('#000000')`
  - [x] 创建 `PerspectiveCamera`，FOV 40，固定机位前上方
  - [x] 添加 `AmbientLight(0xffffff, 0.4)` + `DirectionalLight(0xffffff, 0.8)` 前上方
  - [x] 添加可选 RimLight（`DirectionalLight` 从后方打过来，intensity 0.2）
  - [x] 添加 `GridHelper` 地面网格 + 中心线，颜色 `#1a1a1a` / `#333333`
  - [x] 实现 `start()` / `stop()` 动画循环（`requestAnimationFrame`）
  - [x] 实现 `loadVRM(url)` 方法，使用 `@pixiv/three-vrm` 加载 VRM
  - [x] 实现 `resize(width, height)` 方法更新相机 aspect 和 renderer 尺寸
  - [x] 实现 `showError(msg)` 方法：在黑色背景上显示白色错误文字
  - [x] 添加注释说明 720×1280 渲染 upscale 方案
  - **验证**：TypeScript 编译通过

- [x] Task 3: 创建 CabinetStage.tsx React 组件
  - [x] 使用 `useRef` 持有 canvas 容器 DOM 引用
  - [x] 在 `useEffect` 中创建 `CabinetScene` 实例并调用 `start()`
  - [x] 加载 VRM 模型 `assets/models/cabinet/default.vrm`
  - [x] 监听 `resize` 事件调用 `resize()`
  - [x] 实现 VRM idle 动画（骨骼轻微呼吸/sway，在 CabinetScene 中驱动）
  - [x] 加载失败时显示黑底白色错误提示，不白屏
  - [x] 组件卸载时调用 `dispose()` 清理资源
  - **验证**：TypeScript 编译通过

- [x] Task 4: 修改 CabinetPage.tsx 集成 CabinetStage
  - [x] 将 `.cabinet-scene` 内的占位 `<p>` 替换为 `<CabinetStage />`
  - [x] 保持现有 header 和 subtitle 结构不变
  - **验证**：TypeScript 编译通过，8%/72%/20% 布局不变

- [x] Task 5: 修改 cabinet.css 适配 canvas
  - [x] `.cabinet-scene` 移除占位文字相关样式（`.cabinet-scene-placeholder`）
  - [x] `.cabinet-scene` 改为 `overflow: hidden`，移除 border
  - [x] 确保 canvas 元素填满 `.cabinet-scene` 容器
  - **验证**：页面 `/cabinet` 无样式异常

- [x] Task 6: 创建 assets/models/MANIFEST.json 和 VRM 模型说明
  - [x] 创建 `assets/models/cabinet/` 目录
  - [x] 创建 `assets/models/MANIFEST.json`，包含 default.vrm 的元数据
  - [x] 在 MANIFEST.json 中注明：搜索下载 CC0/可商用温和女性全身 VRM
  - [x] 提供下载指引（VRoid Hub / Booth 等来源）
  - **验证**：MANIFEST.json 格式正确

- [x] Task 7: 端到端验证
  - [x] TypeScript 编译零错误
  - [x] 黑底 3D 场景 + 透视线代码完成
  - [x] VRM 加载逻辑实现（idle 动画在 CabinetScene 中驱动）
  - **注意**：需要实际 VRM 模型文件才能完整验证渲染效果

- [x] Task 8: 创建 SESSION_7B_DONE.md 完成记录
  - [x] 记录新增/修改文件清单
  - [x] 记录验收结果
  - [x] 记录已知问题（需下载 VRM 模型）

# Task Dependencies
- Task 2 依赖 Task 1（需要 three 和 @pixiv/three-vrm 已安装）
- Task 3 依赖 Task 2（需要 CabinetScene 类）
- Task 4 依赖 Task 3（需要 CabinetStage 组件）
- Task 5 可与 Task 3 并行
- Task 6 可与 Task 2-3 并行
- Task 7 依赖 Task 4-5 完成
- Task 8 依赖 Task 7 完成