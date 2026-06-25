/**
 * CabinetBezel — 2D 全息框装饰层（纯 CSS，不影响 WebRTC）
 */

interface CabinetBezelProps {
  showChrome?: boolean;
}

export default function CabinetBezel({ showChrome = true }: CabinetBezelProps) {
  if (!showChrome) return null;

  return (
    <div className="cabinet-bezel" aria-hidden="true">
      <div className="cabinet-bezel-corner cabinet-bezel-corner--tl" />
      <div className="cabinet-bezel-corner cabinet-bezel-corner--tr" />
      <div className="cabinet-bezel-corner cabinet-bezel-corner--bl" />
      <div className="cabinet-bezel-corner cabinet-bezel-corner--br" />
      <div className="cabinet-bezel-top">
        <span className="cabinet-bezel-live">LIVE</span>
        <span className="cabinet-bezel-brand">ElderTalk</span>
      </div>
    </div>
  );
}
