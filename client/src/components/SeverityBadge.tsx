import { Badge } from '@mantine/core';
import type { SeverityLevel } from '../types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

const COLOR_MAP: Record<SeverityLevel, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'teal',
  info: 'gray',
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const color = COLOR_MAP[severity] ?? 'gray';
  return (
    <Badge color={color} size="sm" variant="filled">
      {(severity ?? 'info').toUpperCase()}
    </Badge>
  );
}
