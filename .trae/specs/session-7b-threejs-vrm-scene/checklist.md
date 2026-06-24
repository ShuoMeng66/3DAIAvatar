# Checklist: Session 7B — Three.js 黑底 3D 场景 + VRM 全身角色

## 依赖安装
- [x] `package.json` 中 `three` 已添加为 dependency
- [x] `package.json` 中 `@types/three` 已添加为 devDependency
- [x] `package.json` 中 `@pixiv/three-vrm` 已添加为 dependency
- [x] `npm install` 成功，无错误

## 场景初始化
- [x] `scene.background` 为 `Color('#000000')`（纯黑）
- [x] 无白色/浅色背景或墙面
- [x] 地面网格线可见（`#1a1a1a` ~ `#333333`）
- [x] 网格线提供透视深度感

## 灯光
- [x] `AmbientLight` 存在，intensity 0.4
- [x] `DirectionalLight` 存在，intensity 0.8，前上方位置
- [x] 可选 RimLight 存在（intensity 0.2）

## 相机
- [x] `PerspectiveCamera` FOV 40（在 35–45 之间）
- [x] 相机位置固定，不随用户操作移动
- [x] 相机 lookAt 目标约在角色胸部高度（0, 0.95, 0）

## VRM 角色
- [x] VRM 模型从 `assets/models/cabinet/default.vrm` 加载
- [x] 角色居中站立，全身可见
- [x] 角色占屏幕高度约 70%（通过相机 FOV 和位置控制）
- [x] 角色有 idle 呼吸/sway 动画（spine scale + hips/head rotation）
- [x] 动画连续循环，使用正弦波

## 错误处理
- [x] VRM 加载失败时，背景保持纯黑 #000000
- [x] 加载失败时显示白色错误提示文字
- [x] 不出现白屏或空白 canvas
- [x] WebGL 不可用时由 CabinetScene 错误覆盖层处理

## 集成
- [x] `CabinetPage.tsx` 中 `.cabinet-scene` 使用 `<CabinetStage />`
- [x] 8%/72%/20% 布局比例未改变
- [x] header 标题 + 状态区域未受影响
- [x] subtitle 字幕区域未受影响

## 样式
- [x] `.cabinet-scene` 无占位文字样式残留
- [x] `.cabinet-scene` 无 border
- [x] canvas 元素填满容器

## 模型清单
- [x] `assets/models/MANIFEST.json` 存在
- [x] MANIFEST.json 包含 default.vrm 元数据（来源、许可、描述）
- [x] 下载指引清晰

## 性能
- [x] 渲染循环使用 `requestAnimationFrame`
- [x] 代码中有 720×1280 渲染 upscale 注释说明
- [x] 组件卸载时 dispose 资源

## TypeScript
- [x] `npx tsc --noEmit` 零错误
- [x] 无 `any` 类型滥用（仅在必要时使用）

## 文档
- [x] `SESSION_7B_DONE.md` 已创建
- [x] 完成记录包含文件清单和验收结果