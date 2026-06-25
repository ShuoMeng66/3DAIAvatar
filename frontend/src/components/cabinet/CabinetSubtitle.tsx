/**
 * CabinetSubtitle — 全息仓底部字幕组件
 *
 * 白色大字幕，≥36px，位于全息仓底部 20% 区域。
 * 背景纯黑，仅显示字幕文字，无任何 UI 控件。
 */

import { useEffect, useState } from 'react';
import { BRAND } from '../../config/brand';

interface CabinetSubtitleProps {
  text?: string;
  /** 字幕可见性 */
  visible?: boolean;
}

export default function CabinetSubtitle({ text = '', visible = true }: CabinetSubtitleProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (text) {
      // 字数过多时自动换行，这里不做截断，靠 CSS 处理
      setDisplayText(text);
    }
  }, [text]);

  if (!visible) return null;

  return (
    <div className="cabinet-subtitle-area">
      <p
        className="cabinet-subtitle"
        style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.3)' }}
      >
        {displayText || `${BRAND.listeningHint}`}
      </p>
    </div>
  );
}