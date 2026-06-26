import { Badge } from './ui';

interface ConnectionStatusProps {
  backend: boolean;
  linly: boolean;
}

export default function ConnectionStatus({ backend, linly }: ConnectionStatusProps) {
  return (
    <>
      <Badge
        status={backend ? 'online' : 'offline'}
        label={`API ${backend ? '✓' : '✗'}`}
      />
      <Badge
        status={linly ? 'online' : 'offline'}
        label={`Linly ${linly ? '✓' : '✗'}`}
      />
    </>
  );
}
