import { Group, Stack, Text } from '@mantine/core';
import type { OverallStatsData, ScanData } from '../types';

interface OverallStatsProps {
  scanData: ScanData;
}

export function OverallStats({ scanData }: OverallStatsProps) {
  const allFindings = scanData.sites.flatMap((s) => s.code_analysis);
  const stats: OverallStatsData = {
    totalPages: scanData.sites.length,
    totalFindings: allFindings.length,
    critical: allFindings.filter((f) => f.vulnerabilities.some((v) => v.severity === 'critical'))
      .length,
    high: allFindings.filter((f) => f.vulnerabilities.some((v) => v.severity === 'high')).length,
    medium: allFindings.filter((f) => f.vulnerabilities.some((v) => v.severity === 'medium'))
      .length,
    low: allFindings.filter((f) => f.vulnerabilities.some((v) => v.severity === 'low')).length,
  };

  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text c="dimmed" size="xs">
          Pages
        </Text>
        <Text fw={600} size="xs">
          {stats.totalPages}
        </Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed" size="xs">
          Findings
        </Text>
        <Text fw={600} size="xs">
          {stats.totalFindings}
        </Text>
      </Group>
      {stats.critical > 0 && (
        <Group justify="space-between">
          <Text c="red.4" size="xs">
            Critical
          </Text>
          <Text c="red.4" fw={700} size="xs">
            {stats.critical}
          </Text>
        </Group>
      )}
      {stats.high > 0 && (
        <Group justify="space-between">
          <Text c="orange.4" size="xs">
            High
          </Text>
          <Text c="orange.4" fw={700} size="xs">
            {stats.high}
          </Text>
        </Group>
      )}
      {stats.medium > 0 && (
        <Group justify="space-between">
          <Text c="yellow.4" size="xs">
            Medium
          </Text>
          <Text c="yellow.4" fw={700} size="xs">
            {stats.medium}
          </Text>
        </Group>
      )}
      {stats.low > 0 && (
        <Group justify="space-between">
          <Text c="teal.4" size="xs">
            Low
          </Text>
          <Text c="teal.4" fw={700} size="xs">
            {stats.low}
          </Text>
        </Group>
      )}
    </Stack>
  );
}
