/**
 * CabinetStage — 全息仓 3D 场景 React 组件
 *
 * 封装 CabinetScene 的生命周期：
 * - 挂载时创建场景、加载 VRM、启动动画循环
 * - 卸载时清理资源
 * - 加载失败时显示黑底错误提示
 * - 通过 onSceneReady 回调暴露场景实例供外部控制（口型等）
 */

import { useEffect, useRef, useState } from 'react';
import { CabinetScene } from './CabinetScene';

const VRM_MODEL_PATH = '/assets/models/cabinet/default.vrm';

interface CabinetStageProps {
  onSceneReady?: (scene: CabinetScene) => void;
}

export default function CabinetStage({ onSceneReady }: CabinetStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CabinetScene | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 创建场景
    const scene = new CabinetScene(container);
    sceneRef.current = scene;
    scene.start();

    // 通知外部场景已就绪
    onSceneReady?.(scene);

    // 加载 VRM 模型
    scene.loadVRM(VRM_MODEL_PATH).catch((err) => {
      console.error('[CabinetStage] VRM 加载失败:', err);
      setError(err instanceof Error ? err.message : '模型加载失败');
    });

    // 窗口大小调整
    const handleResize = () => {
      scene.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onSceneReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000000',
      }}
    >
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000000',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '24px',
            textAlign: 'center',
            padding: '0 12%',
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}