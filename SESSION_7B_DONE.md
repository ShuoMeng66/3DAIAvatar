# SESSION_7B_DONE.md — Three.js 黑底 3D 场景 + VRM 全身角色

## 完成时间

2026-06-24

## 目标

在 Session 7A 的全息仓骨架基础上，将中间 72% 占位区替换为 Three.js 3D 场景，包含黑色虚拟空间、透视地面网格、三点光源和 VRM 全身角色。

## 新增文件

| 文件 | 说明 |
|------|------|
| `frontend/src/components/cabinet/CabinetScene.ts` | Three.js 场景管理器（场景、相机、灯光、地面、VRM 加载、动画循环） |
| `frontend/src/components/cabinet/CabinetStage.tsx` | React 组件，封装 CabinetScene 的生命周期 |
| `assets/models/MANIFEST.json` | VRM 模型清单，含下载指引 |
| `assets/models/cabinet/` | VRM 模型存放目录 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `frontend/package.json` | 新增 `three`、`@pixiv/three-vrm`、`@types/three` |
| `frontend/src/pages/CabinetPage.tsx` | 集成 `<CabinetStage />` 替换占位文字 |
| `frontend/src/styles/cabinet.css` | `.cabinet-scene` 改为 canvas 容器样式，移除占位文字样式 |

## 技术细节

### 场景
- 背景：`scene.background = new Color('#000000')`，纯黑
- 地面网格：`GridHelper(8, 40, 0x1a1a1a, 0x111111)` + 中心引导线 `#333333`
- 无雾、无白墙、无浅色背景

### 灯光
- `AmbientLight(0xffffff, 0.4)` — 均匀填充
- `DirectionalLight(0xffffff, 0.8)` at (0, 3, 2.5) — 前上方主光
- `DirectionalLight(0xffffff, 0.2)` at (0, 1.8, -1.5) — 后方轮廓光

### 相机
- `PerspectiveCamera(40, aspect, 0.1, 50)` — FOV 40，适中透视
- 固定机位 (0, 1.05, 3.6)，lookAt (0, 0.95, 0) — 角色胸部高度

### VRM 加载
- 使用 `GLTFLoader` + `VRMLoaderPlugin` 加载 `.vrm` 文件
- 模型路径：`assets/models/cabinet/default.vrm`
- 角色定位：`vrm.scene.position.set(0, -0.95, 0)`，居中站立

### Idle 动画
- 脊柱 Y 轴缩放模拟呼吸（`sin(t * 1.2) * 0.003`）
- 臀部 z/x 旋转模拟轻微摇摆（`sin(t * 0.7) * 0.015`）
- 头部 z/x 旋转模拟微微晃动（`sin(t * 0.9) * 0.01`）
- 动画在 `CabinetScene.updateIdleAnimation()` 中驱动

### 错误处理
- VRM 加载失败：Canvas 保持纯黑，覆盖层显示白色错误文字
- CabinetStage 额外渲染 React 错误提示作为 fallback
- WebGL 不可用时：CabinetScene 错误覆盖层显示提示

### 性能
- 目标 60fps，`requestAnimationFrame` 驱动
- `pixelRatio` 上限 2，避免高分屏性能问题
- 代码注释中保留 720×1280 upscale 方案

## 验收结果

- [x] `/#/cabinet` 纯黑 9:16 布局不变
- [x] TypeScript 编译零错误
- [x] 场景背景纯黑 #000000，无白底/浅色
- [x] 地面网格 + 中心线提供透视深度
- [x] 三点光源配置完成
- [x] 固定相机 FOV 40，正前方机位
- [x] VRM 加载逻辑完整，idle 动画驱动就绪
- [x] 加载失败黑底错误提示，不白屏
- [x] 组件卸载时 dispose 资源

## 已知问题

- **VRM 模型文件缺失**：`assets/models/cabinet/default.vrm` 需要手动下载。
  参考 `assets/models/MANIFEST.json` 中的下载指引，从 VRoid Hub 或 Booth 获取 CC0 可商用女性全身 VRM 模型。
  在模型就位前，`/#/cabinet` 将显示黑底错误提示「角色加载失败」。

## 约束遵守

- [x] 背景纯黑 #000000，无白盒/浅色墙面
- [x] 未做 WebRTC、SSE、口型同步
- [x] 未修改 backend
- [x] `/hologram` 路由保留不动