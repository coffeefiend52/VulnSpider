import { Accordion, Badge, Code, Group, Paper, Stack, Text } from '@mantine/core';
import type { CodeFinding } from '../types';
import { getTypeIcon } from '../utils/findingIcons';
import { SeverityBadge } from './SeverityBadge';

interface FindingCardProps {
  finding: CodeFinding;
  idx: number;
}

export function FindingCard({ finding, idx }: FindingCardProps) {
  const hasVulnerabilities = finding.vulnerabilities.length > 0;

  return (
    <Accordion.Item value={String(idx)} className={hasVulnerabilities ? 'has-vuln' : ''}>
      <Accordion.Control>
        <Group gap="sm">
          <Text size="sm">{getTypeIcon(finding.type)}</Text>
          <Text size="sm" fw={600}>
            {finding.type}
          </Text>
          <Text size="xs" c="dimmed">
            Line{Array.isArray(finding.lines) ? 's' : ''}:{' '}
            {Array.isArray(finding.lines) ? finding.lines.join(', ') : finding.lines}
          </Text>
          {hasVulnerabilities && (
            <Badge color="red" size="xs" variant="light">
              ⚠️ {finding.vulnerabilities.length} vuln
              {finding.vulnerabilities.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <div>
            <Text c="dimmed" fw={600} mb={4} size="xs" tt="uppercase">
              Code
            </Text>
            <Code block>{finding.content}</Code>
          </div>
          {finding.vulnerabilities.length > 0 && (
            <div>
              <Text size="sm" fw={600} mb="xs">
                Vulnerabilities
              </Text>
              <Stack gap="xs">
                {finding.vulnerabilities.map((vuln, i) => (
                  <Paper
                    className={`vuln-paper vuln-${vuln.severity ?? 'info'}`}
                    key={i}
                    p="sm"
                    radius="sm"
                  >
                    <Group gap="xs" mb={4}>
                      <SeverityBadge severity={vuln.severity} />
                    </Group>
                    <Text size="sm">
                      <strong>Description:</strong> {vuln.description}
                    </Text>
                    <Text size="sm">
                      <strong>Recommendation:</strong> {vuln.recommendation}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </div>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
