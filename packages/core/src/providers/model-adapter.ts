import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

export interface LLMProvider {
  name: string;
  complete(req: LLMRequest): Promise<LLMResponse>;
}

export class MockSecurityProvider implements LLMProvider {
  name = "aegis-mock-provider";

  async complete(req: LLMRequest): Promise<LLMResponse> {
    return {
      text: "Hypothesis confirmed based on static analysis dataflow reaching unsanitized system sink.",
      tokensUsed: 150,
      model: "mock-v1"
    };
  }
}

/**
 * Google Gemini Provider Adapter (Supports Google AI Pro / AI Studio API Keys)
 * Native lightweight HTTPS implementation with zero external npm dependencies.
 */
export class GoogleGeminiProvider implements LLMProvider {
  name = "google-gemini";
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName = "gemini-1.5-pro") {
    this.apiKey = apiKey || process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"] || "";
    this.modelName = process.env["GEMINI_MODEL"] || modelName;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("Google Gemini API key not found. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.");
    }

    const payload = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${req.systemPrompt}\n\nTask:\n${req.userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: req.temperature ?? 0.2,
        maxOutputTokens: req.maxTokens ?? 2048
      }
    });

    return new Promise((resolve, reject) => {
      const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`);
      const clientReq = httpsRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`Gemini API Error (${res.statusCode}): ${parsed.error?.message || data}`));
            }
            const candidate = parsed.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text || "";
            const tokens = parsed.usageMetadata?.totalTokenCount || 200;
            resolve({
              text,
              tokensUsed: tokens,
              model: this.modelName
            });
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${e}`));
          }
        });
      });

      clientReq.on("error", reject);
      clientReq.write(payload);
      clientReq.end();
    });
  }
}

/**
 * Local OpenAI / Ollama / vLLM HTTP Adapter
 */
export class LocalOpenAiProvider implements LLMProvider {
  name = "local-openai";
  private readonly endpoint: string;
  private readonly modelName: string;

  constructor(endpoint = "http://127.0.0.1:11434/v1", modelName = "qwen2.5-coder") {
    this.endpoint = process.env["HEIMDALL_LOCAL_ENDPOINT"] || endpoint;
    this.modelName = process.env["HEIMDALL_LOCAL_MODEL"] || modelName;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const url = new URL(`${this.endpoint.replace(/\/+$/, "")}/chat/completions`);
    const payload = JSON.stringify({
      model: this.modelName,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt }
      ],
      temperature: req.temperature ?? 0.2
    });

    return new Promise((resolve, reject) => {
      const client = url.protocol === "https:" ? httpsRequest : httpRequest;
      const clientReq = client(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.message?.content || "";
            resolve({
              text,
              tokensUsed: parsed.usage?.total_tokens || 100,
              model: this.modelName
            });
          } catch (e) {
            reject(new Error(`Failed to parse local LLM response: ${e}`));
          }
        });
      });

      clientReq.on("error", reject);
      clientReq.write(payload);
      clientReq.end();
    });
  }
}

export class ModelAdapterRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: LLMProvider;

  constructor() {
    const mock = new MockSecurityProvider();
    const gemini = new GoogleGeminiProvider();
    const local = new LocalOpenAiProvider();

    this.providers.set(mock.name, mock);
    this.providers.set(gemini.name, gemini);
    this.providers.set(local.name, local);

    // Auto-detect default provider based on active environment variables
    if (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"]) {
      this.defaultProvider = gemini;
    } else if (process.env["HEIMDALL_LOCAL_ENDPOINT"] || process.env["OLLAMA_HOST"]) {
      this.defaultProvider = local;
    } else {
      this.defaultProvider = mock;
    }
  }

  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name?: string): LLMProvider {
    if (!name) return this.defaultProvider;
    return this.providers.get(name) || this.defaultProvider;
  }
}
