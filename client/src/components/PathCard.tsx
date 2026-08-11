import { Badge, Card, Group, Text } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import type { PathCardStats, Site } from '../types';

interface PathCardProps {
  site: Site;
  isSelected: boolean;
  onClick: () => void;
}

export function PathCard({ site, isSelected, onClick }: PathCardProps) {
  const stats: PathCardStats = {
    total: site.code_analysis.length,
    vulnerabilities: site.code_analysis.filter((f) => f.vulnerabilities.length > 0).length,
    critical: site.code_analysis.filter((f) =>
      f.vulnerabilities.some((v) => v.severity === 'critical'),
    ).length,
    high: site.code_analysis.filter((f) => f.vulnerabilities.some((v) => v.severity === 'high'))
      .length,
    medium: site.code_analysis.filter((f) => f.vulnerabilities.some((v) => v.severity === 'medium'))
      .length,
  };

  const maxSeverity =
    stats.critical > 0
      ? 'critical'
      : stats.high > 0
        ? 'high'
        : stats.medium > 0
          ? 'medium'
          : 'safe';

  const severityColor: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    safe: 'teal',
  };

  return (
    <Card
      className={`path-card ${isSelected ? 'selected' : ''} severity-border-${maxSeverity}`}
      onClick={onClick}
      padding="sm"
      radius="md"
      style={{ cursor: 'pointer' }}
    >
      <Group gap="xs" mb={4}>
        <IconFileText size={14} />
        <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
          {site.path}
        </Text>
      </Group>
      <Text c="dimmed" size="xs">
        {stats.total} findings
      </Text>
      {stats.vulnerabilities > 0 && (
        <Text c="red.4" size="xs">
          ⚠️ {stats.vulnerabilities} vulnerabilities
        </Text>
      )}
      {site.code_analysis_errors.length > 0 && (
        <Text c="yellow.5" size="xs">
          ⚠ {site.code_analysis_errors.length} analysis error
          {site.code_analysis_errors.length !== 1 ? 's' : ''}
        </Text>
      )}
      {maxSeverity !== 'safe' && (
        <Badge color={severityColor[maxSeverity]} mt={4} size="xs" variant="light">
          {maxSeverity.toUpperCase()}
        </Badge>
      )}
    </Card>
  );
}
