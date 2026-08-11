import { useState } from 'react';
import { Badge, Button, Divider, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { IconCode, IconFileText, IconSearch, IconShieldCheck } from '@tabler/icons-react';

import './App.css';
import { CodeView } from './components/CodeView';
import { FindingsView } from './components/FindingsView';
import { OverallStats } from './components/OverallStats';
import { PathCard } from './components/PathCard';
import { RobotsTxtPanel } from './components/RobotsTxtPanel';
import { ScanForm } from './components/ScanForm';
import { useScan } from './hooks/useScan';
import type { ViewMode } from './types';

function App() {
  const { scanData, selectedPath, setSelectedPath, loading, scanProgress, startScan, reset } =
    useScan();
  const [viewMode, setViewMode] = useState<ViewMode>('findings');

  if (!scanData) {
    return (
      <div className="app">
        <header className="app-header">
          <Group gap="xs" h="100%" px="md">
            <IconShieldCheck size={24} />
            <Title order={3}>Web Vulnerability Scanner</Title>
          </Group>
        </header>
        <main className="app-main app-main--centered">
          <ScanForm loading={loading} onScan={startScan} />
        </main>
      </div>
    );
  }

  const selectedSite = scanData.sites.find((site) => site.path === selectedPath);

  if (!selectedSite) {
    return (
      <div className="app">
        <header className="app-header">
          <Group h="100%" px="md" gap="xs">
            <IconShieldCheck size={24} />
            <Title order={3}>Web Vulnerability Scanner</Title>
          </Group>
        </header>
        <main className="app-main app-main--centered">
          <Text c="dimmed" ta="center">
            No pages found for this scan.
          </Text>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <Group gap="xs" h="100%" px="md">
          <IconShieldCheck size={24} />
          <Title order={3}>Web Vulnerability Scanner</Title>
        </Group>
      </header>

      <div className="app-body">
        <nav className="app-navbar">
          <div className="navbar-title">
            <Group gap="xs" justify="space-between">
              <Text fw={600} size="sm">
                Scanned Pages
              </Text>
              {loading && (
                <Badge color="blue" size="xs" variant="light">
                  {scanProgress} scanned…
                </Badge>
              )}
            </Group>
          </div>

          <ScrollArea className="navbar-scroll">
            <Stack gap="xs" p="sm">
              {scanData.sites.map((site) => (
                <PathCard
                  isSelected={selectedPath === site.path}
                  key={site.path}
                  site={site}
                  onClick={() => setSelectedPath(site.path)}
                />
              ))}
            </Stack>
          </ScrollArea>

          <div className="navbar-footer">
            {scanData.robots_txt && (
              <>
                <Divider />
                <div className="navbar-footer-section">
                  <RobotsTxtPanel robotsTxt={scanData.robots_txt} />
                </div>
              </>
            )}
            <Divider />
            <div className="navbar-footer-section">
              <Text fw={600} size="sm" mb="xs">
                Overall Statistics
              </Text>
              <OverallStats scanData={scanData} />
            </div>
            <Divider />
            <div className="navbar-footer-section">
              <Button
                fullWidth
                leftSection={<IconSearch size={16} />}
                onClick={reset}
                variant="light"
              >
                New Scan
              </Button>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <Group className="content-header" justify="space-between" mb="md">
            <Title order={4}>{selectedPath}</Title>
            <Group gap="xs">
              <Button
                leftSection={<IconFileText size={16} />}
                onClick={() => setViewMode('findings')}
                size="sm"
                variant={viewMode === 'findings' ? 'filled' : 'light'}
              >
                Findings
              </Button>
              <Button
                leftSection={<IconCode size={16} />}
                onClick={() => setViewMode('code')}
                size="sm"
                variant={viewMode === 'code' ? 'filled' : 'light'}
              >
                Code View
              </Button>
            </Group>
          </Group>

          {viewMode === 'findings' ? (
            <FindingsView site={selectedSite} />
          ) : (
            <CodeView site={selectedSite} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
