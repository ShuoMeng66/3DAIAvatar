/**
 * CabinetScene — Three.js 全息仓 3D 场景管理器
 *
 * 职责：
 * - 初始化纯黑背景 Three.js 场景
 * - 深灰透视线地面网格
 * - 三点光源（环境光 + 主方向光 + 轮廓光）
 * - 固定机位 PerspectiveCamera（FOV 40）
 * - VRM 全身角色加载与 idle 动画
 * - 性能：720×1280 渲染 upscale 方案（注释说明）
 */

import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 场景默认分辨率（全息仓 2K 竖屏） */
const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 2560;

/**
 * 性能优化：若 2K 渲染压力大，可改为 720×1280 渲染，再通过 CSS
 * `canvas { width: 100%; height: 100% }` 由浏览器 upscale 到 1440×2560。
 * 修改方式：将下面两行取消注释，并注释掉 1440×2560 两行。
 *
 *   const RENDER_WIDTH  = 720;
 *   const RENDER_HEIGHT = 1280;
 */
const RENDER_WIDTH = DEFAULT_WIDTH;
const RENDER_HEIGHT = DEFAULT_HEIGHT;

// ---------------------------------------------------------------------------
// CabinetScene
// ---------------------------------------------------------------------------

export class CabinetScene {
  // Three.js 核心
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // VRM
  private vrm: VRM | null = null;

  // 状态
  private running = false;
  private animationId = 0;
  private clock = new THREE.Clock();

  // 错误消息 DOM
  private errorEl: HTMLDivElement | null = null;

  // 容器引用
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // --- Scene ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    // 不使用雾，保持纯黑背景

    // --- Camera ---
    // 竖屏 9:16，FOV 40 提供适中透视感
    this.camera = new THREE.PerspectiveCamera(
      40,
      RENDER_WIDTH / RENDER_HEIGHT,
      0.1,
      50,
    );
    // 固定机位：正前方，稍高，看向角色胸部高度
    this.camera.position.set(0, 1.05, 3.6);
    this.camera.lookAt(0, 0.95, 0);

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 性能上限
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // canvas 填满容器，由 CSS 控制 upscale
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    // --- Lights ---
    this.setupLights();

    // --- Ground Grid ---
    this.setupGroundGrid();

    // --- Error Overlay ---
    this.setupErrorOverlay();
  }

  // -----------------------------------------------------------------------
  // 灯光
  // -----------------------------------------------------------------------

  private setupLights(): void {
    // 环境光：均匀填充，避免死黑区域
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // 主方向光：前上方，提供主要照明和立体感
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(0, 3, 2.5);
    this.scene.add(keyLight);

    // 轮廓光（Rim）：从后方偏上打来，分离角色与黑色背景
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 1.8, -1.5);
    this.scene.add(rimLight);
  }

  // -----------------------------------------------------------------------
  // 地面网格（透视线）
  // -----------------------------------------------------------------------

  private setupGroundGrid(): void {
    // 主网格：深灰细线，从脚下延伸到远处
    const gridSize = 8;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x1a1a1a, // 中心线 / 主线颜色
      0x111111, // 次线颜色
    );
    // 网格平放在 XZ 平面（默认），下沉到角色脚下
    gridHelper.position.y = -0.95;
    this.scene.add(gridHelper);

    // 额外：一条亮色中心线向前延伸，增强透视引导
    const centerLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.95, 0),
      new THREE.Vector3(0, -0.95, -gridSize / 2),
    ]);
    const centerLine = new THREE.Line(
      centerLineGeo,
      new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 }),
    );
    this.scene.add(centerLine);
  }

  // -----------------------------------------------------------------------
  // 错误覆盖层
  // -----------------------------------------------------------------------

  private setupErrorOverlay(): void {
    this.errorEl = document.createElement('div');
    this.errorEl.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: #000000;
      color: rgba(255,255,255,0.6);
      font-size: 24px;
      font-family: 'Noto Sans SC', system-ui, sans-serif;
      text-align: center;
      padding: 0 12%;
      pointer-events: none;
    `;
    this.container.appendChild(this.errorEl);
  }

  // -----------------------------------------------------------------------
  // VRM 加载
  // -----------------------------------------------------------------------

  async loadVRM(url: string): Promise<void> {
    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      const gltf = await loader.loadAsync(url);
      const vrm = gltf.userData.vrm as VRM;

      if (!vrm) {
        throw new Error('VRM 模型未包含 VRM 扩展数据');
      }

      this.vrm = vrm;
      this.scene.add(vrm.scene);

      // 调整角色位置：居中站立，占屏幕高度约 70%
      // VRM 模型通常以原点为脚底，需要微调
      vrm.scene.position.set(0, -0.95, 0);
    } catch (err) {
      this.showError(`角色加载失败：${err instanceof Error ? err.message : '未知错误'}`);
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // 动画循环
  // -----------------------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.startMouthAnimation();
    this.animate();
  }

  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.clock.stop();
  }

  private animate = (): void => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1); // 防止大帧间隔

    // VRM idle 动画
    if (this.vrm) {
      this.updateIdleAnimation(delta);
      this.vrm.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  // -----------------------------------------------------------------------
  // Idle 动画（呼吸 + 轻微摇摆）
  // -----------------------------------------------------------------------

  private idleTime = 0;

  private updateIdleAnimation(delta: number): void {
    if (!this.vrm) return;
    this.idleTime += delta;

    const humanoid = this.vrm.humanoid;
    const t = this.idleTime;

    // 呼吸：脊柱 Y 轴轻微缩放（模拟胸腔起伏）
    const spine = humanoid.getNormalizedBoneNode('spine');
    if (spine) {
      const breathScale = 1 + Math.sin(t * 1.2) * 0.003;
      spine.scale.set(1, breathScale, 1);
    }

    // 轻微身体摇摆
    const hips = humanoid.getNormalizedBoneNode('hips');
    if (hips) {
      const sway = Math.sin(t * 0.7) * 0.015;
      hips.rotation.z = sway;
      hips.rotation.x = Math.cos(t * 0.5) * 0.008;
    }

    // 头部微微晃动
    const head = humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.z = Math.sin(t * 0.9 + 0.5) * 0.01;
      head.rotation.x = Math.cos(t * 0.6) * 0.008;
    }
  }

  // -----------------------------------------------------------------------
  // 窗口大小调整
  // -----------------------------------------------------------------------

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // 注意：renderer 尺寸保持 RENDER_WIDTH/RENDER_HEIGHT，由 CSS upscale
    // 如需动态调整渲染分辨率，可取消下面注释：
    // this.renderer.setSize(width, height);
  }

  // -----------------------------------------------------------------------
  // 错误显示
  // -----------------------------------------------------------------------

  showError(message: string): void {
    if (this.errorEl) {
      this.errorEl.textContent = message;
      this.errorEl.style.display = 'flex';
    }
  }

  hideError(): void {
    if (this.errorEl) {
      this.errorEl.style.display = 'none';
    }
  }

  // -----------------------------------------------------------------------
  // 口型动画（VRM Blend Shape 驱动）
  // -----------------------------------------------------------------------

  private mouthAnimationId = 0;
  private mouthOpenness = 0;
  private mouthTarget = 0;
  private mouthTimer = 0;

  /**
   * 设置口型开合度（0 = 闭合，1 = 最大张开）
   */
  setMouthOpenness(value: number): void {
    this.mouthTarget = Math.max(0, Math.min(1, value));
  }

  /**
   * 重置口型到闭合状态
   */
  resetMouth(): void {
    this.mouthTarget = 0;
    this.mouthOpenness = 0;
    this.applyMouthBlendShapes(0);
  }

  private applyMouthBlendShapes(value: number): void {
    if (!this.vrm) return;
    const blendShapeProxy = this.vrm.expressionManager;
    if (!blendShapeProxy) return;

    // 驱动常见口型 blend shapes
    const mouthShapes = ['a', 'i', 'u', 'e', 'o'];
    for (const shape of mouthShapes) {
      try {
        blendShapeProxy.setValue(shape, value * 0.5);
      } catch {
        // 某些 VRM 模型可能不支持全部口型
      }
    }
  }

  /**
   * 启动口型动画循环（volume-based 正弦波振荡）
   */
  private startMouthAnimation(): void {
    if (this.mouthAnimationId) return;
    const animate = () => {
      if (!this.running) {
        this.mouthAnimationId = 0;
        return;
      }
      this.mouthAnimationId = requestAnimationFrame(animate);

      // 平滑过渡到目标值
      this.mouthOpenness += (this.mouthTarget - this.mouthOpenness) * 0.15;

      if (this.mouthTarget > 0.01) {
        // 说话时叠加正弦振荡模拟口型变化
        this.mouthTimer += 0.016;
        const oscillation = Math.abs(Math.sin(this.mouthTimer * 8)) * this.mouthOpenness;
        this.applyMouthBlendShapes(oscillation);
      } else {
        this.applyMouthBlendShapes(this.mouthOpenness);
      }
    };
    this.mouthAnimationId = requestAnimationFrame(animate);
  }

  // -----------------------------------------------------------------------
  // 资源清理
  // -----------------------------------------------------------------------

  dispose(): void {
    this.stop();

    if (this.mouthAnimationId) {
      cancelAnimationFrame(this.mouthAnimationId);
      this.mouthAnimationId = 0;
    }

    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      // VRM 的 dispose 由 three-vrm 内部处理
      this.vrm = null;
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();

    if (this.errorEl) {
      this.errorEl.remove();
      this.errorEl = null;
    }
  }
}