# Ollama Integration Plan for PickPic (Kechiki)

This guide details how to deploy, secure, and integrate **Ollama** as a background service on your Windows Server environment, co-located with IIS, Next.js, and .NET.

## A. Service Setup (Windows)

We will run Ollama as a background Windows Service using **NSSM**, ensuring it starts automatically and remains isolated.

### 1. Download & Install
1.  Download **Ollama for Windows** from [ollama.com/download](https://ollama.com/download).
2.  Install to the default location (`C:\Users\<User>\AppData\Local\Programs\Ollama`).
3.  **Shut down** the tray icon app if it starts automatically (right-click tray icon -> Quit). We will run it as a service instead.

### 2. Configure Service via NSSM
Open PowerShell as Administrator:

```powershell
# 1. Path to Ollama Executable (Verify content matches your install)
$OllamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama_app.exe"

# 2. Install Service
nssm install OllamaService $OllamaPath "serve"

# 3. Configure Binding & Storage
# Binds to the specific IP and Port requested.
# WARNING: If 162.55.212.193 is a PUBLIC IP, this EXPOSES Ollama to the internet.
# Ensure Windows Firewall blocks external access to port 84.
nssm set OllamaService AppEnvironmentExtra "OLLAMA_HOST=162.55.212.193:84`nOLLAMA_MODELS=C:\Ollama\Models"

# 4. Configure Restart Policy
nssm set OllamaService AppExit Default Restart
nssm set OllamaService AppRestartDelay 10000

# 5. Start Service
nssm start OllamaService
```

> **Note**: Only set `OLLAMA_HOST` to `162.55.212.193` if that IP exists on a network interface. If unsure, use `127.0.0.1:84` to bind to localhost only.

### 3. Verify
```powershell
curl -v http://162.55.212.193:84/
# Should return "Ollama is running"
```

---

## B. Model Strategy

For a collaborative marketplace, we need a balance of speed and conversation quality.

### Selected Models

| Role | Model | Size | Use Case |
| :--- | :--- | :--- | :--- |
| **Primary Brain** | `llama3:8b-instruct-q4_K_M` | ~4.9GB | General chat, Seller tips, Buyer assistance. Excellent English/Arabic balance. |
| **Fast Tasker** | `gemma:2b` | ~1.7GB | Quick classifications, simple translations, strict JSON output. |
| **RAG/Knowledge**| `nomic-embed-text` | ~274MB | (Optional) If you implement vector search later. |

### Quantization Strategy
- **CPU-Only Server**: Use `q4_K_M` (4-bit quantization). It is the "sweet spot" for speed vs quality on modern CPUs.
- **GPU Server**: You can upgrade to `q6_K` or `fp16` if VRAM permits, but `q4` is usually sufficient for commerce tasks.

### Initialization
Run these once to pull models into the service:
```powershell
ollama pull llama3
ollama pull gemma:2b
```

---

## C. Application Integration

### 1. Next.js (Frontend/BFF)
Create a utility to stream responses. Do not expose 162.xx to the client; proxy through Next.js.

**File:** `src/lib/ai/ollama.ts`
```typescript
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://162.55.212.193:84';

export async function generateChatResponse(messages: any[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages,
        stream: true, // Enable streaming
        keep_alive: '15m' // Keep model loaded
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Ollama overloaded');
    return response.body; 

  } catch (error) {
    if (error.name === 'AbortError') throw new Error('AI Timeout');
    throw error;
  }
}
```

### 2. .NET 8 (Backend)
Register a Typed HttpClient in `Program.cs`.

**File:** `Program.cs`
```csharp
builder.Services.AddHttpClient<IOllamaClient, OllamaClient>(client =>
{
    client.BaseAddress = new Uri("http://162.55.212.193:84");
    client.Timeout = TimeSpan.FromSeconds(60);
})
.AddStandardResilienceHandler(); // Adds retries/circuit breakers (requires Microsoft.Extensions.Http.Resilience)
```

**File:** `Infrastructure/Ai/OllamaClient.cs`
```csharp
public class OllamaClient(HttpClient httpClient) : IOllamaClient
{
    public async Task<string> GenerateAsync(string prompt, CancellationToken ct)
    {
        var request = new { model = "llama3", prompt = prompt, stream = false };
        var response = await httpClient.PostAsJsonAsync("/api/generate", request, ct);
        
        if (!response.IsSuccessStatusCode) return "AI currently unavailable.";
        
        var result = await response.Content.ReadFromJsonAsync<OllamaResponse>(ct);
        return result?.Response ?? "";
    }
}
```

---

## D. Security & Stability

### 1. Firewall (CRITICAL)
Since we are binding to a specific IP which might be public, **you must block port 84 via Windows Firewall**.

```powershell
# Block external access to Port 84
New-NetFirewallRule -DisplayName "Block External Ollama" `
    -Direction Inbound `
    -Action Block `
    -Protocol TCP `
    -LocalPort 84 `
    -RemoteAddress Any

# Allow ONLY localhost and local subnet (adjust as needed)
New-NetFirewallRule -DisplayName "Allow Internal Ollama" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 84 `
    -RemoteAddress "127.0.0.1" # Add your VPN/Private subnet here
```

### 2. Input Validation
- **length**: Truncate all inputs to 2000 chars before sending to Ollama.
- **injection**: Prepend system prompts with instructions to ignore conflicting user commands.

---

## E. Performance & Observability

### 1. Resource Limits
- **Threads**: CPU inference is heavy. If PickPic is under load, limit Ollama threads.
- **Configuration**: Set `OLLAMA_NUM_PARALLEL=2` to prevent queuing too many requests.

### 2. Monitoring
Add a health check endpoint in .NET/Next.js that pings `http://162.55.212.193:84/api/tags`.
- If status != 200: Alert Admin.
- If latency > 5s: Log warning.

---

## F. System Prompts (PickPic)

**Buyer Assistant**:
> "You are PickPic, a helpful shopping assistant for Kuwait. You speak English and Arabic. Help users find products based on descriptions. Format prices in KWD. Be casual and brief."

**Seller Assistant**:
> "You are a listing expert. Analyze this product description and suggest 3 improvements to make it sell faster. Focus on details like condition, brand, and exact location."

**Moderation**:
> "Analyze this text. Return JSON: { \"safe\": boolean, \"reason\": string }. Flag for: hate speech, illegal items (drugs, weapons), or spam."

---

## G. Failure Strategy

1.  **Crash**: NSSM will auto-restart Ollama after 10s.
2.  **Overload**: The Circuit Breaker in .NET/Next.js will open.
    - **App Behavior**: UI shows "AI Assistant taking a nap 😴" but core commerce (Search, Checkout) remains fully functional.
3.  **Fallback**: If `llama3` fails to load (OOM), configure a fallback to `gemma:2b` in your code logic (retry with smaller model).
