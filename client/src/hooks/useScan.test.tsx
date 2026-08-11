import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScan } from './useScan';

// Builds a fake fetch Response whose body streams the given raw SSE text
// back in one chunk, mirroring what the server sends from /crawl.
function sseResponse(sseText: string) {
  const encoder = new TextEncoder();
  let delivered = false;
  const reader = {
    read: async () => {
      if (!delivered) {
        delivered = true;
        return { done: false, value: encoder.encode(sseText) };
      }
      return { done: true, value: undefined };
    },
  };
  return {
    ok: true,
    body: { getReader: () => reader },
    json: async () => ({}),
  } as unknown as Response;
}

const samplePage = {
  path: '/',
  html_content: '',
  links: [],
  response_headers: {},
  code_analysis: [],
  header_analysis: [],
  cookie_analysis: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useScan', () => {
  it('calls the /crawl endpoint the server actually serves', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse(
        `data: ${JSON.stringify({ type: 'page', page: samplePage })}\n\n` +
          `data: ${JSON.stringify({ type: 'done', certificate: '', robots_txt: null })}\n\n`,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useScan());

    await act(async () => {
      await result.current.startScan('https://example.com', false, 10, '', 'qwen2.5-coder:7b');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toMatch(/\/crawl$/);
    expect(calledUrl).not.toMatch(/\/crawl\/stream$/);
  });

  it('streams page events into scanData as they arrive', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse(
        `data: ${JSON.stringify({ type: 'page', page: samplePage })}\n\n` +
          `data: ${JSON.stringify({ type: 'done', certificate: 'cert', robots_txt: null })}\n\n`,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useScan());

    await act(async () => {
      await result.current.startScan('https://example.com', false, 10, '', 'qwen2.5-coder:7b');
    });

    await waitFor(() => {
      expect(result.current.scanData?.sites).toHaveLength(1);
    });
    expect(result.current.scanData?.sites[0].path).toBe('/');
    expect(result.current.scanData?.certificate).toBe('cert');
    expect(result.current.loading).toBe(false);
  });
});
