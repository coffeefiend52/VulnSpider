import { Badge, Code, Group, Paper, Stack, Text } from '@mantine/core';
import type { HeaderFinding } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface HeadersPanelProps {
  findings: HeaderFinding[];
}

export function HeadersPanel({ findings }: HeadersPanelProps) {
  if (findings.length === 0) {
    return (
      <Text c="dimmed" ta="center" mt="xl">
        ✅ All security headers are present and correctly configured
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {findings.map((finding, idx) => (
        <Paper className={`vuln-paper vuln-${finding.severity}`} key={idx} p="sm" radius="sm">
          <Group gap="xs" mb={4} justify="space-between">
            <Group gap="xs">
              <Text fw={600} size="sm">
                {finding.header}
              </Text>
              <Badge color={finding.present ? 'blue' : 'gray'} size="xs" variant="light">
                {finding.present ? 'Present' : 'Missing'}
              </Badge>
            </Group>
            <SeverityBadge severity={finding.severity} />
          </Group>
          {finding.value && (
            <Text c="dimmed" mb={4} size="xs">
              Value: <Code>{finding.value}</Code>
            </Text>
          )}
          <Text size="sm">
            <strong>Issue:</strong> {finding.description}
          </Text>
          <Text size="sm">
            <strong>Recommendation:</strong> {finding.recommendation}
          </Text>
        </Paper>
      ))}
    </Stack>
  );
}
