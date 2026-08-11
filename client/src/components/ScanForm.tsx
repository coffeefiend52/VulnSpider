import { useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { API_URL } from '../api';

interface ScanFormProps {
  onScan: (
    url: string,
    respectRobots: boolean,
    maxPages: number,
    maxDepth: number | '',
    model: string,
  ) => void;
  loading: boolean;
}

export function ScanForm({ onScan, loading }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [respectRobots, setRespectRobots] = useState(false);
  const [maxPages, setMaxPages] = useState<number>(50);
  const [maxDepth, setMaxDepth] = useState<number | ''>('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(true);

  // Fetch available models from the backend on mount
  useState(() => {
    fetch(`${API_URL}/models`)
      .then((r) => r.json())
      .then((data) => {
        const list: string[] = data.models ?? [];
        setModels(list);
        setSelectedModel(data.default ?? list[0] ?? '');
      })
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onScan(url.trim(), respectRobots, maxPages, maxDepth, selectedModel);
  };

  return (
    <div className="scan-form-wrapper">
      <Paper className="scan-form-card" p="xl" radius="md">
        <Stack gap="md">
          <div>
            <Title order={3} mb={4}>
              Scan a Website
            </Title>
            <Text c="dimmed" size="sm">
              Enter a URL to crawl and analyse for security vulnerabilities.
            </Text>
          </div>
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <Group align="flex-end" gap="sm">
                <TextInput
                  disabled={loading}
                  flex={1}
                  leftSection={<IconSearch size={16} />}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  type="url"
                  value={url}
                />
                <Button
                  disabled={loading || !url.trim()}
                  leftSection={<IconSearch size={16} />}
                  type="submit"
                >
                  {loading ? 'Scanning...' : 'Scan'}
                </Button>
              </Group>
              <Group gap="sm" grow align="flex-start">
                <NumberInput
                  disabled={loading}
                  label="Max pages"
                  min={1}
                  max={200}
                  value={maxPages}
                  onChange={(v) => setMaxPages(typeof v === 'number' ? v : 50)}
                  size="sm"
                />
                <Stack gap={4}>
                  <NumberInput
                    disabled={loading}
                    label="Max depth"
                    min={1}
                    max={20}
                    placeholder="Unlimited"
                    value={maxDepth}
                    onChange={(v) => setMaxDepth(v === '' ? '' : typeof v === 'number' ? v : '')}
                    size="sm"
                  />
                  <Text c="dimmed" size="xs">
                    Leave empty for unlimited
                  </Text>
                </Stack>
              </Group>
              <Select
                data={models}
                disabled={loading || modelsLoading || models.length === 0}
                label="Model"
                placeholder={
                  modelsLoading
                    ? 'Loading models…'
                    : models.length === 0
                      ? 'No models available'
                      : 'Select a model'
                }
                value={selectedModel}
                onChange={(v) => setSelectedModel(v ?? '')}
                size="sm"
              />
              <Checkbox
                checked={respectRobots}
                disabled={loading}
                label="Respect robots.txt"
                onChange={(e) => setRespectRobots(e.currentTarget.checked)}
                size="sm"
              />
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
