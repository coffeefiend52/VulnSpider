import { Badge, Code, Group, Paper, Stack, Text } from '@mantine/core';
import type { CookieFinding } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface CookiesPanelProps {
  findings: CookieFinding[];
}

export function CookiesPanel({ findings }: CookiesPanelProps) {
  if (findings.length === 0) {
    return (
      <Text c="dimmed" ta="center" mt="xl">
        ✅ No Set-Cookie headers found on this page
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {findings.map((cookie, idx) => (
        <Paper key={idx} p="sm" radius="sm" withBorder>
          <Group gap="xs" mb={6}>
            <Text fw={600} size="sm">
              🍪 {cookie.name}
            </Text>
            {cookie.issues.length > 0 ? (
              <Badge color="orange" size="xs" variant="light">
                {cookie.issues.length} issue{cookie.issues.length !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge color="teal" size="xs" variant="light">
                OK
              </Badge>
            )}
          </Group>
          <Text c="dimmed" mb={cookie.issues.length > 0 ? 8 : 0} size="xs">
            <Code>{cookie.raw}</Code>
          </Text>
          {cookie.issues.length > 0 && (
            <Stack gap="xs">
              {cookie.issues.map((issue, i) => (
                <Paper className={`vuln-paper vuln-${issue.severity}`} key={i} p="sm" radius="sm">
                  <Group gap="xs" mb={4} justify="space-between">
                    <Text fw={600} size="sm">
                      {issue.attribute}
                    </Text>
                    <SeverityBadge severity={issue.severity} />
                  </Group>
                  <Text size="sm">
                    <strong>Issue:</strong> {issue.description}
                  </Text>
                  <Text size="sm">
                    <strong>Recommendation:</strong> {issue.recommendation}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
