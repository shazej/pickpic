# Ollama + Qwen on RunPod L4 GPU — Production Setup Guide

> **Environment:** RunPod container · NVIDIA L4 (24GB VRAM) · 94GB RAM · Ubuntu

---

## Model Selection (Do This First)

For an L4 (24GB VRAM), the optimal choice is:

| Model | VRAM Usage | Speed (est.) | Recommendation |
|---|---|---|---|
| `qwen2.5:7b` | ~4.7 GB | ~90 tok/s | Fastest, lower quality |
| `qwen2.5:14b` (Q4_K_M) | ~8.7 GB | ~55 tok/s | Best balance |
| `qwen2.5:14b` (Q5_K_M) | ~10.7 GB | ~50 tok/s | Better quality, still fast |
| `qwen2.5:14b-instruct-q8_0` | ~15 GB | ~40 tok/s | **Near-lossless quality — SELECTED** |
| `qwen2.5:32b` (Q4_K_M) | ~18.5 GB | ~25 tok/s | Powerful but less headroom |

**Selected:** `qwen2.5:14b-instruct-q8_0` — near-full precision weights, ~15GB VRAM, ~9GB free for long context. Best quality the L4 can run at this parameter count.

---

## Section 1 — SSH & Environment Check

```bash
# Confirm you're in the right environment
nvidia-smi
# Expected: L4, CUDA version, 24564 MiB total memory

cat /etc/os-release
# Expected: Ubuntu 22.x

# Check CUDA toolkit
nvcc --version

# Free disk space (Q8_0 model needs ~15GB)
df -h /
df -h /workspace
```

---

## Section 2 — Install Ollama (GPU-Enabled)

```bash
# Install Ollama — auto-detects CUDA
curl -fsSL https://ollama.com/install.sh | sh

# Verify binary is installed
which ollama
ollama --version

# Confirm CUDA libraries were picked up
ls /usr/local/lib/ollama/
# You should see libcuda.so or similar CUDA libs linked
```

---

## Section 3 — Configure Ollama for External Access

By default Ollama only listens on `127.0.0.1`. For your Node.js backend to reach it, you need to bind to `0.0.0.0`.

```bash
# Create environment config directory
mkdir -p /etc/ollama

# Set permanent environment variables
cat >> /etc/environment << 'EOF'
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_KEEP_ALIVE=24h
OLLAMA_NUM_PARALLEL=2
OLLAMA_MAX_LOADED_MODELS=1
EOF

# Export for current session
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_KEEP_ALIVE=24h
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=1
```

**`OLLAMA_KEEP_ALIVE=24h`** — keeps model loaded in VRAM between requests (critical for latency).
**`OLLAMA_NUM_PARALLEL=2`** — handle 2 concurrent requests on the L4.
**`OLLAMA_MAX_LOADED_MODELS=1`** — prevent VRAM fragmentation.

---

## Section 4 — Start Ollama & Pull Model

```bash
# Start Ollama in the background (write logs to /workspace)
OLLAMA_HOST=0.0.0.0:11434 \
OLLAMA_KEEP_ALIVE=24h \
OLLAMA_NUM_PARALLEL=2 \
OLLAMA_MAX_LOADED_MODELS=1 \
nohup ollama serve > /workspace/ollama.log 2>&1 &

# Confirm it started
sleep 3
curl http://localhost:11434/
# Expected: "Ollama is running"

# Pull Qwen 14B Q8_0 (takes 8–15 min depending on network — ~15GB download)
ollama pull qwen2.5:14b-instruct-q8_0

# Verify it downloaded
ollama list
```

---

## Section 5 — Verify GPU Is Being Used (Not CPU Fallback)

```bash
# In one terminal, watch GPU memory
watch -n 1 nvidia-smi

# In another terminal, run a test prompt
ollama run qwen2.5:14b-instruct-q8_0 "Say hello"
```

In `nvidia-smi` you must see VRAM usage jump to ~15GB when the model loads. If it stays at 0 MB, CUDA is not being used.

```bash
# Verbose mode — confirms GPU layers
OLLAMA_DEBUG=1 ollama run qwen2.5:14b-instruct-q8_0 "test" 2>&1 | head -40
# Look for: "llm_load_tensors: offloaded X/X layers to GPU"
# All layers should be GPU-offloaded

# Check how many GPU layers were loaded
ollama show qwen2.5:14b-instruct-q8_0-instruct-q8_0 --verbose 2>&1 | grep -i gpu
```

If you see `offloaded 0/X layers to GPU`, CUDA is not working — see Section 9 (Debug).

---

## Section 6 — Production Service Setup (RunPod Auto-Start)

RunPod containers do not always have `systemd`. Use a startup script stored on the persistent `/workspace` volume.

```bash
# Create a startup script on the persistent volume
cat > /workspace/start_ollama.sh << 'EOF'
#!/bin/bash
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_KEEP_ALIVE=24h
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=1

LOG=/workspace/ollama.log

echo "[$(date)] Starting Ollama..." >> $LOG

# Kill any stale instances
pkill -f "ollama serve" 2>/dev/null
sleep 2

# Start Ollama
nohup ollama serve >> $LOG 2>&1 &

sleep 5

# Pre-warm the model (loads into VRAM immediately — ~15GB, takes ~10s)
ollama run qwen2.5:14b-instruct-q8_0 "Warmup" >> $LOG 2>&1

echo "[$(date)] Ollama ready." >> $LOG
EOF

chmod +x /workspace/start_ollama.sh
```

**To auto-run on pod start**, set this in your RunPod pod settings under **"Container Start Command"**:

```
bash /workspace/start_ollama.sh
```

Or append to `/root/.bashrc` for interactive sessions:

```bash
echo "bash /workspace/start_ollama.sh &" >> /root/.bashrc
```

---

## Section 7 — API Usage

### Health Check

```bash
curl http://localhost:11434/
# "Ollama is running"
```

### Generate (non-streaming)

```bash
curl -s http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:14b-instruct-q8_0",
    "prompt": "What is the capital of France?",
    "stream": false
  }' | python3 -m json.tool
```

### Chat Completions (OpenAI-compatible)

Ollama exposes an OpenAI-compatible endpoint at `/v1/chat/completions`:

```bash
curl -s http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:14b-instruct-q8_0",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in 2 sentences."}
    ],
    "temperature": 0.7,
    "max_tokens": 512,
    "stream": false
  }'
```

### Node.js Integration

**Option A — Direct HTTP (no dependencies):**

```javascript
// ollama.js
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://<YOUR_RUNPOD_IP>:11434';

async function chat(messages, options = {}) {
  const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:14b-instruct-q8_0',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Usage
(async () => {
  const reply = await chat([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2 + 2?' },
  ]);
  console.log(reply);
})();
```

**Option B — Using `ollama` npm package:**

```bash
npm install ollama
```

```javascript
import Ollama from 'ollama';

const ollama = new Ollama.Ollama({ host: 'http://<YOUR_RUNPOD_IP>:11434' });

const response = await ollama.chat({
  model: 'qwen2.5:14b-instruct-q8_0',
  messages: [{ role: 'user', content: 'Explain REST APIs.' }],
});

console.log(response.message.content);
```

**Option C — Use OpenAI SDK (drop-in compatible):**

```bash
npm install openai
```

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://<YOUR_RUNPOD_IP>:11434/v1',
  apiKey: 'ollama', // required but ignored by Ollama
});

const completion = await client.chat.completions.create({
  model: 'qwen2.5:14b-instruct-q8_0',
  messages: [{ role: 'user', content: 'Summarize this contract.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Section 8 — Security

### Scenario A: Node.js App on the Same RunPod Pod

Use `localhost` — no exposure needed:
```bash
OLLAMA_URL=http://127.0.0.1:11434
```

### Scenario B: Node.js App on a Separate Server

**Step 1 — Install Nginx as a reverse proxy with auth:**

```bash
apt-get update && apt-get install -y nginx apache2-utils

# Create a strong API key
API_KEY=$(openssl rand -hex 32)
echo "Your API key: $API_KEY"

# Create htpasswd file
htpasswd -cb /etc/nginx/.htpasswd apiuser $API_KEY
```

**Step 2 — Configure Nginx:**

```bash
cat > /etc/nginx/sites-available/ollama << 'EOF'
server {
    listen 8080;

    location / {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://127.0.0.1:11434;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
```

**Step 3 — Update Ollama to bind only to localhost:**

```bash
export OLLAMA_HOST=127.0.0.1:11434
```

**Step 4 — From your Node.js app:**

```javascript
const response = await fetch('http://<RUNPOD_IP>:8080/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('apiuser:<API_KEY>').toString('base64'),
  },
  body: JSON.stringify({ model: 'qwen2.5:14b-instruct-q8_0', prompt: '...', stream: false }),
});
```

**Step 5 — Firewall (restrict port 11434 entirely):**

```bash
# Block direct access to Ollama port
ufw deny 11434
ufw allow 8080
ufw allow 22
ufw enable
```

---

## Section 9 — Monitoring & Logging

```bash
# Tail live Ollama logs
tail -f /workspace/ollama.log

# Watch GPU in real time
watch -n 2 nvidia-smi

# Check Ollama process
ps aux | grep ollama

# List loaded models and their VRAM usage
curl -s http://localhost:11434/api/ps | python3 -m json.tool

# Check model info
ollama show qwen2.5:14b-instruct-q8_0
```

### Simple log rotation (add to cron):

```bash
# Rotate logs weekly
echo "0 0 * * 0 truncate -s 0 /workspace/ollama.log" | crontab -
```

---

## Section 10 — Testing

### Basic smoke test:

```bash
curl -s http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:14b-instruct-q8_0",
    "prompt": "List 3 programming languages and one use case for each.",
    "stream": false,
    "options": {
      "temperature": 0.5,
      "num_predict": 256
    }
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['response'])"
```

### Expected output:
A coherent 3-item list. Response time should be **under 5 seconds** for this prompt on the L4.

### GPU performance check:

```bash
# Run this and watch nvidia-smi simultaneously
time curl -s http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5:14b-instruct-q8_0","prompt":"Write a 500 word essay on AI.","stream":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Tokens: {d.get('eval_count',0)}, Speed: {d.get('eval_count',0)/max(d.get('eval_duration',1)/1e9,0.01):.1f} tok/s\")"
```

**Expected:** ~40 tok/s on L4 with `qwen2.5:14b-instruct-q8_0`.

---

## Section 11 — Debug: GPU Not Being Used

```bash
# 1. Check NVIDIA drivers
nvidia-smi
# Must show: Driver Version, CUDA Version, L4 GPU

# 2. Check Ollama can see CUDA
OLLAMA_DEBUG=1 ollama serve &
# Look for: "CUDA device found" or "GPU layers: X"

# 3. Check CUDA libraries
ldconfig -p | grep libcuda
ls /usr/local/cuda/lib64/

# 4. Reinstall Ollama if CUDA not detected
curl -fsSL https://ollama.com/install.sh | sh

# 5. Confirm model layer offload
ollama run qwen2.5:14b-instruct-q8_0 "test" 2>&1 | grep -i "layers to GPU"
# Must show: "offloaded 48/48 layers to GPU" (or similar full count)

# 6. If VRAM shows 0 after model load — force CUDA
CUDA_VISIBLE_DEVICES=0 ollama serve
```

---

## Section 12 — Cost Optimisation Tips

- **Stop the pod when not in use** — at $0.41/hr, idle hours add up fast
- **Use `OLLAMA_KEEP_ALIVE=5m`** for low-traffic APIs — unloads model when idle (saves VRAM for other tasks, at cost of ~3s cold start)
- **You're using Q8_0** — near-lossless quality at ~40 tok/s. If you ever need to cut latency, drop to `qwen2.5:14b` (Q4_K_M) for ~55 tok/s
- **Set `num_predict` limits** in your API calls to cap runaway token generation:
  ```json
  { "options": { "num_predict": 1024 } }
  ```
- **Batch your requests** where possible — Ollama processes them more efficiently than rapid single-token calls

---

## Quick Reference

```bash
# Start Ollama
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_KEEP_ALIVE=24h nohup ollama serve > /workspace/ollama.log 2>&1 &

# Pull model
ollama pull qwen2.5:14b-instruct-q8_0

# Test
curl -s http://localhost:11434/api/generate -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5:14b-instruct-q8_0","prompt":"Hello","stream":false}' | python3 -m json.tool

# Watch GPU
watch -n 1 nvidia-smi

# Check logs
tail -f /workspace/ollama.log

# List running models
curl -s http://localhost:11434/api/ps | python3 -m json.tool

# Stop Ollama
pkill -f "ollama serve"
```
