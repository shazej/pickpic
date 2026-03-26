import { AiProvider } from "./ai-provider.interface";
import OpenAI from "openai";

export class OllamaProvider implements AiProvider {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    // Standardize baseURL by removing trailing slash
    // Prefer AI_BASE_URL over OLLAMA_BASE_URL
    this.baseURL = (process.env.AI_BASE_URL || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    // Prefer AI_API_KEY over OLLAMA_API_KEY
    this.apiKey = process.env.AI_API_KEY || process.env.OLLAMA_API_KEY || "ollama";
  }

  /**
   * Helper to map OpenAI message format to Ollama native format
   * Supports vision messages by extracting base64 images
   */
  private mapMessages(messages: any[]) {
    return messages.map((m) => {
      const ollamaMsg: any = {
        role: m.role,
        content: "",
      };

      if (typeof m.content === "string") {
        ollamaMsg.content = m.content;
      } else if (Array.isArray(m.content)) {
        // Handle OpenAI multi-modal content array
        for (const item of m.content) {
          if (item.type === "text") {
            ollamaMsg.content += item.text;
          } else if (item.type === "image_url") {
            const url = item.image_url?.url || "";
            if (url.startsWith("data:image")) {
              const base64 = url.split(",")[1];
              if (!ollamaMsg.images) ollamaMsg.images = [];
              ollamaMsg.images.push(base64);
            }
          }
        }
      }

      return ollamaMsg;
    });
  }

  async createChatCompletion(
    options: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "stream">
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        model: options.model,
        messages: this.mapMessages(options.messages as any[]),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Map native Ollama response back to OpenAI format
    return {
      id: `ollama-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: data.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.message?.content || "",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    } as OpenAI.Chat.Completions.ChatCompletion;
  }

  async createChatCompletionStream(
    options: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming, "stream">
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const baseURL = this.baseURL;
    const apiKey = this.apiKey;
    const mapMessages = this.mapMessages.bind(this);

    return (async function* () {
      try {
        console.log(`[OllamaProvider] Requesting: ${baseURL}/chat with model ${options.model}`);
        const response = await fetch(`${baseURL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            model: options.model,
            messages: mapMessages(options.messages as any[]),
            stream: true,
            options: {
              temperature: options.temperature ?? 0.7,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[OllamaProvider] API Error (${response.status}): ${errorText}`);
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        if (!response.body) {
          console.error("[OllamaProvider] Response body is null");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[OllamaProvider] Stream reader done");
            break;
          }

          const decoded = decoder.decode(value, { stream: true });
          console.log(`[OllamaProvider] Chunk received: ${decoded}`);
          buffer += decoded;
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep the last partial line in the buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              console.log(`[OllamaProvider] Parsed JSON: ${JSON.stringify(json)}`);
              yield {
                id: `ollama-${Date.now()}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: json.model,
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: json.message?.content || "",
                    },
                    finish_reason: json.done ? "stop" : null,
                  },
                ],
              } as OpenAI.Chat.Completions.ChatCompletionChunk;

              if (json.done) {
                console.log("[OllamaProvider] Stream signalling done");
                return;
              }
            } catch (e) {
              console.error("[OllamaProvider] Error parsing Ollama stream chunk:", e, line);
            }
          }
        }

        // Process any remaining data in the buffer
        if (buffer.trim()) {
          console.log(`[OllamaProvider] Processing final buffer: ${buffer}`);
          try {
            const json = JSON.parse(buffer);
            yield {
              id: `ollama-${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: json.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: json.message?.content || "",
                  },
                  finish_reason: json.done ? "stop" : null,
                },
              ],
            } as OpenAI.Chat.Completions.ChatCompletionChunk;
          } catch (e) {
            console.error("[OllamaProvider] Error parsing final Ollama stream chunk:", e, buffer);
          }
        }
      } catch (err) {
        console.error("[OllamaProvider] Stream error:", err);
        throw err;
      }
    })();
  }

  async createEmbedding(text: string, model?: string): Promise<number[]> {
    // Fallback to /api/embeddings for Ollama native compatibility
    const response = await fetch(`${this.baseURL}/api/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        model: model || this.getDefaultEmbeddingModel(),
        prompt: text,
      }),
    });

    if (!response.ok) {
      // Try /v1/embeddings if /api/embeddings fails
      const retryResponse = await fetch(`${this.baseURL}/v1/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          model: model || this.getDefaultEmbeddingModel(),
          input: text,
        }),
      });

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`Ollama Embedding error: ${errorText}`);
      }

      const data = await retryResponse.json();
      return data.data[0].embedding;
    }

    const data = await response.json();
    return data.embedding;
  }

  getDefaultChatModel(): string {
    return process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b";
  }

  getDefaultVisionModel(): string {
    return process.env.OLLAMA_VISION_MODEL || "llava";
  }

  getDefaultEmbeddingModel(): string {
    return process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
  }
}
