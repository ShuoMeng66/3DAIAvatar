interface SubtitleBarProps {
  text: string;
}

export default function SubtitleBar({ text }: SubtitleBarProps) {
  return (
    <div className="rounded-2xl bg-white/90 border border-purple-border px-4 py-3 shadow-[var(--shadow-purple-card)]">
      <p className="subtitle-text text-purple-text">{text}</p>
    </div>
  );
}
