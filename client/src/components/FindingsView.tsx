import { Accordion, Tabs, Text } from '@mantine/core';
import type { CodeFinding, CookieFinding, FindingTabKey, HeaderFinding, Site } from '../types';
import { CookiesPanel } from './CookiesPanel';
import { FindingCard } from './FindingCard';
import { HeadersPanel } from './HeadersPanel';

interface FindingsViewProps {
  site: Site;
}

export function FindingsView({ site }: FindingsViewProps) {
  const headerFindings: HeaderFinding[] = site.header_analysis ?? [];
  const cookieFindings: CookieFinding[] = site.cookie_analysis ?? [];

  const groupedFindings: Record<FindingTabKey, CodeFinding[]> = {
    all: site.code_analysis,
    vulnerabilities: site.code_analysis.filter((f) => f.vulnerabilities.length > 0),
    scripts: site.code_analysis.filter((f) => f.type.startsWith('script')),
    forms: site.code_analysis.filter((f) => f.type === 'form'),
    secrets: site.code_analysis.filter((f) => f.type === 'secret'),
    comments: site.code_analysis.filter((f) => f.type === 'comment'),
  };

  return (
    <Tabs className="findings-tabs" defaultValue="all">
      <Tabs.List mb="md">
        {(Object.entries(groupedFindings) as [FindingTabKey, CodeFinding[]][]).map(
          ([key, findings]) => (
            <Tabs.Tab key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({findings.length})
            </Tabs.Tab>
          ),
        )}
        <Tabs.Tab value="headers">Headers ({headerFindings.length})</Tabs.Tab>
        <Tabs.Tab value="cookies">Cookies ({cookieFindings.length})</Tabs.Tab>
      </Tabs.List>

      {(Object.entries(groupedFindings) as [FindingTabKey, CodeFinding[]][]).map(
        ([key, findings]) => (
          <Tabs.Panel key={key} value={key}>
            {findings.length === 0 ? (
              <Text c="dimmed" ta="center" mt="xl">
                ✅ No {key} found
              </Text>
            ) : (
              <Accordion classNames={{ item: 'finding-accordion-item' }} variant="separated">
                {findings.map((finding, idx) => (
                  <FindingCard finding={finding} idx={idx} key={idx} />
                ))}
              </Accordion>
            )}
          </Tabs.Panel>
        ),
      )}

      <Tabs.Panel value="headers">
        <HeadersPanel findings={headerFindings} />
      </Tabs.Panel>

      <Tabs.Panel value="cookies">
        <CookiesPanel findings={cookieFindings} />
      </Tabs.Panel>
    </Tabs>
  );
}
