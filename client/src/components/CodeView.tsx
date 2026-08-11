import { useState } from 'react';
import { CodeHighlight } from '@mantine/code-highlight';
import { Divider, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import type { CodeFinding, Site } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface CodeViewProps {
  site: Site;
}

export function CodeView({ site }: CodeViewProps) {
  const htmlContent = atob(site.html_content);
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding | null>(null);

  const lineToFindings: Record<number, CodeFinding[]> = {};
  site.code_analysis.forEach((finding) => {
    const lineNumbers = Array.isArray(finding.lines) ? finding.lines : [finding.lines];
    lineNumbers.forEach((line) => {
      if (!lineToFindings[line]) lineToFindings[line] = [];
      lineToFindings[line].push(finding);
    });
  });

  const lines = htmlContent.split('\n');

  return (
    <div className="code-view-container">
      <div className="code-panel">
        <Group className="code-panel-header" justify="space-between" px="md" py="sm">
          <Text fw={600} size="sm">
            Source Code
          </Text>
          <Text c="dimmed" size="xs">
            {lines.length} lines
          </Text>
        </Group>
        <ScrollArea className="code-scroll">
          <pre className="code-display">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const findings = lineToFindings[lineNum];
              const hasVuln = findings?.some((f) => f.vulnerabilities.length > 0);
              return (
                <div
                  key={idx}
                  className={`code-line ${findings ? 'has-finding' : ''} ${hasVuln ? 'has-vuln' : ''}`}
                  onClick={() => findings && setSelectedFinding(findings[0])}
                >
                  <span className="line-number">{lineNum}</span>
                  <span className="line-content">{line}</span>
                </div>
              );
            })}
          </pre>
        </ScrollArea>
      </div>

      <div className="details-panel">
        <Text fw={600} mb="sm" size="sm">
          Finding Details
        </Text>
        <Divider mb="sm" />
        {selectedFinding ? (
          <Stack gap="sm">
            <div>
              <Text c="dimmed" fw={600} mb={4} size="xs" tt="uppercase">
                Code
              </Text>
              <CodeHighlight code={selectedFinding.content} language="html" />
            </div>
            {selectedFinding.vulnerabilities.length > 0 && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Vulnerabilities
                </Text>
                <Stack gap="xs">
                  {selectedFinding.vulnerabilities.map((vuln, i) => (
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
        ) : (
          <Text c="dimmed" size="sm" ta="center">
            Click on a highlighted line to see details
          </Text>
        )}
      </div>
    </div>
  );
}
