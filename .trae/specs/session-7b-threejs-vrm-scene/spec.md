# Session 7B：Three.js 黑底 3D 场景 + VRM 全身角色 Spec

## Why
Session 7A 搭建了全息仓展示页骨架（纯黑 9:16 布局），但中间 72% 区域仅为占位文字。本 Session 需要将占位区替换为真实的 Three.js 3D 场景，渲染一个黑色虚拟空间 + 全身 VRM 角色，为后续数字人实时交互提供视觉基础。

## What Changes
- 安装 `three`、`@types/three`、`@pixiv/three-vrm` 依赖
- 新增 `CabinetStage.tsx`：React 组件，挂载 Three.js Canvas 到 `.cabinet-scene` 区域
- 新增 `CabinetScene.ts`：Three.js 场景管理器（相机、灯光、地面、VRM 加载、动画循环）
- 修改 `CabinetPage.tsx`：将占位 `<div>` 替换为 `<CabinetStage />`
- 修改 `cabinet.css`：`.cabinet-scene` 移除占位文字样式，改为 canvas 容器样式
- 新增 `assets/models/MANIFEST.json`：VRM 模型清单
- 下载 CC0 VRM 模型到 `assets/models/cabinet/default.vrm`

## Impact
- Affected specs: session-7a-cabinet-skeleton（7A 的骨架页面）
- Affected code: `frontend/src/pages/CabinetPage.tsx`, `frontend/src/styles/cabinet.css`, `frontend/package.json`
- New files: `frontend/src/components/cabinet/CabinetStage.tsx`, `frontend/src/components/cabinet/CabinetScene.ts`, `assets/models/MANIFEST.json`
- No backend changes, no WebRTC/SSE/lip-sync

## ADDED Requirements

### Requirement: 3D Scene Initialization
The system SHALL initialize a Three.js scene with pure black background and dark perspective grid lines on the floor.

#### Scenario: Scene renders with correct background
- **WHEN** the `/cabinet` page loads
- **THEN** the 3D canvas background is `#000000` (pure black)
- **AND** no white/light-colored walls or boxes are visible

#### Scenario: Floor grid lines create depth
- **WHEN** viewing the scene
- **THEN** dark grid lines (`#1a1a1a` to `#333333`) are visible on the floor plane
- **AND** lines extend into the distance creating perspective depth
- **AND** grid is implemented via GridHelper or LineSegments

### Requirement: Lighting Setup
The system SHALL provide three-point lighting: ambient, key directional, and optional rim light.

#### Scenario: Ambient light fills the scene
- **WHEN** scene renders
- **THEN** an AmbientLight of intensity 0.4 illuminates all surfaces uniformly

#### Scenario: Directional light provides depth
- **WHEN** scene renders
- **THEN** a DirectionalLight of intensity 0.8 is positioned from the front-upper direction
- **AND** casts shadows on the character creating 3D depth

#### Scenario: Optional rim light separates character from background
- **WHEN** scene renders
- **THEN** a weak rim/back light (intensity ≤ 0.3) illuminates the character's edges
- **AND** helps separate the character silhouette from the black background

### Requirement: Camera Configuration
The system SHALL use a fixed front-facing PerspectiveCamera with FOV 35–45.

#### Scenario: Camera is positioned correctly
- **WHEN** scene renders
- **THEN** the camera FOV is between 35–45 degrees
- **AND** the camera is positioned at a fixed front-facing location
- **AND** the camera looks at the character's center (approximately chest height)
- **AND** the camera does not orbit or move (fixed position)

### Requirement: VRM Character Loading and Rendering
The system SHALL load a full-body VRM model and display it standing in the center of the scene.

#### Scenario: VRM model loads successfully
- **WHEN** the scene initializes
- **THEN** the VRM model at `assets/models/cabinet/default.vrm` is loaded
- **AND** the character is positioned at the center of the scene
- **AND** the character occupies approximately 70% of the screen height
- **AND** the character is a full-body standing pose (not just head/upper body)

#### Scenario: VRM model manifests
- **WHEN** the model manifest is read
- **THEN** `assets/models/MANIFEST.json` contains metadata for the default VRM model
- **AND** includes source, license (CC0 or commercial-use), and description

#### Scenario: Character idle animation
- **WHEN** the VRM model is loaded
- **THEN** the character performs a subtle idle breathing/sway animation
- **AND** animation is continuous and loops smoothly
- **AND** animation does not distract from the character's presence

### Requirement: Performance Optimization
The system SHALL target 60fps rendering with optional resolution scaling.

#### Scenario: Frame rate target
- **WHEN** the scene is running
- **THEN** the render loop targets 60fps
- **AND** uses `requestAnimationFrame` for smooth rendering

#### Scenario: Resolution scaling option
- **WHEN** rendering performance is a concern
- **THEN** the code includes a commented option to render at 720×1280 and upscale to 1440×2560
- **AND** the upscale approach is documented in code comments

### Requirement: Error Handling
The system SHALL display a black-background error message when VRM loading fails.

#### Scenario: VRM load failure
- **WHEN** the VRM model fails to load (network error, file not found, parse error)
- **THEN** the scene background remains pure black `#000000`
- **AND** a white error message is displayed in the center of the scene
- **AND** no white screen or blank canvas appears
- **AND** the error message is readable against the black background

#### Scenario: Three.js initialization failure
- **WHEN** WebGL is not available
- **THEN** a fallback message is displayed on black background
- **AND** the page does not crash or show a white screen

### Requirement: CabinetPage Integration
The system SHALL integrate CabinetStage into the existing CabinetPage layout.

#### Scenario: CabinetStage replaces placeholder
- **WHEN** CabinetPage renders
- **THEN** the `.cabinet-scene` div contains the `CabinetStage` component instead of placeholder text
- **AND** the existing header (8%) and subtitle (20%) areas remain unchanged
- **AND** the 8% / 72% / 20% layout ratio is preserved

### Requirement: Dependency Management
The system SHALL add Three.js and VRM dependencies to the frontend project.

#### Scenario: Dependencies are declared
- **WHEN** inspecting `package.json`
- **THEN** `three` is listed in dependencies
- **AND** `@types/three` is listed in devDependencies
- **AND** `@pixiv/three-vrm` is listed in dependencies