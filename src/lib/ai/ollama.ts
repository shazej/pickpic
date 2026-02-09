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

    } catch (error: any) {
        if (error.name === 'AbortError') throw new Error('AI Timeout');
        throw error;
    }
}
