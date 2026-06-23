interface SubtitleBarProps {
  text: string;
}

export default function SubtitleBar({ text }: SubtitleBarProps) {
  return (
    <div className="subtitle-text text-center py-2">
      {text}
    </div>
  );
}