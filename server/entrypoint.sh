#!/bin/bash

# Exit on any error
set -e

echo "Starting AI Web Crawler Security Server..."

# Pull the configured model via Python (curl is not available in this image)
python - <<'EOF'
import json
import os
import sys
import requests

base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
model = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:7b")

print(f"Pulling Ollama model: {model} ...", flush=True)
try:
    with requests.post(f"{base_url}/api/pull", json={"name": model}, stream=True, timeout=1800) as resp:
        resp.raise_for_status()
        last_pct: dict = {}
        for raw in resp.iter_lines():
            if not raw:
                continue
            data = json.loads(raw)
            status = data.get("status", "")
            total = data.get("total", 0)
            completed = data.get("completed", 0)
            digest = data.get("digest", "")

            if "pulling" in status and total:
                short = digest.split(":")[-1][:12] if digest else status
                pct = int(completed / total * 100)
                prev = last_pct.get(short, -1)
                if pct - prev >= 5 or pct == 100:
                    print(f"  pulling {short}: {pct}%", flush=True)
                    last_pct[short] = pct
            elif status in ("success", "already exists"):
                print("Model ready.", flush=True)
                sys.exit(0)
            elif status:
                print(f"  {status}", flush=True)
    print("ERROR: pull stream ended without success status", flush=True)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: failed to pull model: {e}", flush=True)
    sys.exit(1)
EOF

# Start the Flask application via Gunicorn
exec gunicorn --bind 0.0.0.0:5000 --workers 2 app:app
