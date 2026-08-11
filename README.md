# AI Web Crawler Security

Crawls a website within a given domain and scans each page for security
vulnerabilities, returning findings as JSON from an API and rendering them
in a browsable frontend.

## What it does

- Crawls same-domain pages up to a configurable page limit / link depth,
  optionally respecting `robots.txt`.
- Scans each page's HTML and same-domain scripts for vulnerabilities using
  an LLM (via [Ollama](https://ollama.com)).
- Checks HTTP response headers and cookies against security best practices
  (HSTS, X-Frame-Options, `Secure`/`HttpOnly`/`SameSite`, etc.).
- Reports the site's TLS certificate and `robots.txt` rules.
- Streams results to the frontend as pages are scanned, via Server-Sent
  Events.

## Architecture

```
server/            Flask API (Python)
  crawler/           crawling, SSRF-safe URL fetching, robots.txt, TLS
  analysis/           LLM-based code/script scanning, header + cookie checks
client/            React 19 + TypeScript + Vite + Mantine UI
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) running locally (or reachable), with a code
  model pulled, e.g. `ollama pull qwen2.5-coder:7b`

## Quick start (Docker)

The simplest way to run everything (client, API, and Ollama) together is
Docker Compose — see [DOCKER.md](DOCKER.md).

```bash
docker-compose up --build
```

## Local development

### Backend

```bash
cd server
pip install -r requirements-dev.txt
flask --app app run --port 5000
```

Relevant environment variables (all optional, sensible defaults apply):

| Variable          | Default                                             | Purpose                          |
| ------------------ | ---------------------------------------------------- | --------------------------------- |
| `OLLAMA_BASE_URL`  | `http://localhost:11434`                            | Where to reach Ollama             |
| `OLLAMA_MODEL`     | `qwen2.5-coder:7b`                                  | Default model for code scanning   |
| `CORS_ORIGINS`     | `http://localhost:5173,http://localhost:4000`        | Allowed frontend origins          |

### Frontend

```bash
cd client
npm install
npm run dev
```

Configure `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

## API

| Endpoint          | Method | Description                                                        |
| ------------------ | ------ | -------------------------------------------------------------------- |
| `/crawl`           | POST   | Streams crawl/analysis results as Server-Sent Events                |
| `/models`          | GET    | Lists available Ollama models                                       |
| `/health`          | GET    | Health check                                                        |

`POST /crawl` body:

```json
{
  "url": "https://example.com",
  "max_pages": 50,
  "max_depth": 5,
  "respect_robots": false,
  "model": "qwen2.5-coder:7b"
}
```

## Linting & formatting

```bash
cd server && make check    # ruff + black --check
cd client && npm run lint  # eslint
cd client && npm run format
```