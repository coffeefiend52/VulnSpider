import { Accordion, Badge, Code, Group, Stack, Text } from '@mantine/core';
import type { RobotsTxtResult } from '../types';

interface RobotsTxtPanelProps {
  robotsTxt: RobotsTxtResult;
}

export function RobotsTxtPanel({ robotsTxt }: RobotsTxtPanelProps) {
  const allDisallowed = robotsTxt.rules.flatMap((r) => r.disallowed);
  const wildcardRule = robotsTxt.rules.find((r) => r.user_agent === '*');
  const wildcardDisallowed = wildcardRule?.disallowed ?? [];

  return (
    <Accordion variant="filled" radius="sm">
      <Accordion.Item value="robots">
        <Accordion.Control>
          <Group gap="xs">
            <Text fw={600} size="sm">
              Robots.txt
            </Text>
            {robotsTxt.found ? (
              <Badge color="orange" size="xs" variant="light">
                {allDisallowed.length} disallowed path{allDisallowed.length !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge color="gray" size="xs" variant="light">
                Not found
              </Badge>
            )}
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          {!robotsTxt.found ? (
            <Text c="dimmed" size="xs">
              No robots.txt file was found at this origin.
            </Text>
          ) : (
            <Stack gap="xs">
              {wildcardDisallowed.length > 0 && (
                <div>
                  <Text c="dimmed" fw={600} mb={4} size="xs" tt="uppercase">
                    Disallowed (* agent)
                  </Text>
                  <Stack gap={2}>
                    {wildcardDisallowed.map((path, i) => (
                      <Code key={i} block={false}>
                        {path}
                      </Code>
                    ))}
                  </Stack>
                </div>
              )}
              {robotsTxt.sitemaps.length > 0 && (
                <div>
                  <Text c="dimmed" fw={600} mb={4} size="xs" tt="uppercase">
                    Sitemaps
                  </Text>
                  <Stack gap={2}>
                    {robotsTxt.sitemaps.map((s, i) => (
                      <Code key={i} block={false}>
                        {s}
                      </Code>
                    ))}
                  </Stack>
                </div>
              )}
              {robotsTxt.crawl_delay !== null && (
                <Text size="xs">
                  Crawl-delay: <Code>{robotsTxt.crawl_delay}s</Code>
                </Text>
              )}
              {robotsTxt.raw && (
                <div>
                  <Text c="dimmed" fw={600} mb={4} size="xs" tt="uppercase">
                    Raw
                  </Text>
                  <Code block>{robotsTxt.raw}</Code>
                </div>
              )}
            </Stack>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
