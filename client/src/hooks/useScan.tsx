import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { API_URL } from '../api';
import type { ScanData, Site, SseDoneEvent, SseErrorEvent, SsePageEvent } from '../types';

type SseEvent = SsePageEvent | SseDoneEvent | SseErrorEvent;

export function useScan() {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const startScan = async (
    url: string,
    respectRobots: boolean,
    maxPages: number,
    maxDepth: number | '',
    model: string,
  ) => {
    setLoading(true);
    setScanProgress(0);
    setScanData(null);
    setSelectedPath('');

    const notifId = notifications.show({
      loading: true,
      title: 'Scanning…',
      message: 'Connecting…',
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const response = await fetch(`${API_URL}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          respect_robots: respectRobots,
          max_pages: maxPages,
          model,
          ...(maxDepth !== '' ? { max_depth: maxDepth } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Scan failed');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let pageCount = 0;
      let firstPage = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are delimited by double newlines
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const event = JSON.parse(line.slice(6)) as SseEvent;

            if (event.type === 'page') {
              const site: Site = {
                ...event.page,
                code_analysis: Array.isArray(event.page.code_analysis)
                  ? event.page.code_analysis
                  : [],
                code_analysis_errors: Array.isArray(event.page.code_analysis_errors)
                  ? event.page.code_analysis_errors
                  : [],
                header_analysis: Array.isArray(event.page.header_analysis)
                  ? event.page.header_analysis
                  : [],
                cookie_analysis: Array.isArray(event.page.cookie_analysis)
                  ? event.page.cookie_analysis
                  : [],
              };
              pageCount++;
              setScanProgress(pageCount);
              setScanData((prev) => {
                const base = prev ?? { certificate: null, sites: [], robots_txt: null };
                return { ...base, sites: [...base.sites, site] };
              });
              if (firstPage) {
                firstPage = false;
                setSelectedPath(site.path);
              }
              notifications.update({
                id: notifId,
                loading: true,
                title: 'Scanning…',
                message: `Scanned ${pageCount} page${pageCount !== 1 ? 's' : ''}…`,
                autoClose: false,
                withCloseButton: false,
              });
            } else if (event.type === 'done') {
              setScanData((prev) =>
                prev
                  ? { ...prev, certificate: event.certificate, robots_txt: event.robots_txt }
                  : null,
              );
              notifications.update({
                id: notifId,
                loading: false,
                title: 'Scan complete',
                message: `Found ${pageCount} page${pageCount !== 1 ? 's' : ''}.`,
                color: 'teal',
                icon: <IconCheck size={16} />,
                autoClose: 4000,
                withCloseButton: true,
              });
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'An unknown error occurred';
      notifications.update({
        id: notifId,
        loading: false,
        title: 'Scan failed',
        message: msg,
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setScanData(null);

  return {
    scanData,
    selectedPath,
    setSelectedPath,
    loading,
    scanProgress,
    startScan,
    reset,
  };
}
