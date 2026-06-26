type BadgeStatus = 'online' | 'offline' | 'connecting';

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

const config: Record<
  BadgeStatus,
  { dot: string; text: string; defaultLabel: string }
> = {
  online: {
    dot: 'bg-purple-success',
    text: 'text-purple-success',
    defaultLabel: '在线',
  },
  offline: {
    dot: 'bg-gray-400',
    text: 'text-purple-text-muted',
    defaultLabel: '离线',
  },
  connecting: {
    dot: 'bg-purple-primary animate-purple-pulse',
    text: 'text-purple-primary',
    defaultLabel: '连接中',
  },
};

export default function Badge({ status, label }: BadgeProps) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-2 text-base font-medium ${c.text}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
      {label ?? c.defaultLabel}
    </span>
  );
}
