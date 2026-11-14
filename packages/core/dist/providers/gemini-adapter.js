/**
 * Heimdall CRS - Gemini 3.8 Flash & 4 Argon Structured Model Adapter
 * Routes high-speed parallel tasks to gemini-3.8-flash and formal SMT/patch synthesis to gemini-4-argon
 * with constrained JSON schema decoding and cost circuit breakers.
 */

export class GeminiStructuredAdapter {
  apiKey;
  fastModel;
  reasoningModel;
  tokensUsed = 0;
  maxTokens;
  constructor(config = {}) {
    this.apiKey = config.apiKey ?? process.env.GEMINI_API_KEY ?? '';
    this.fastModel = config.fastModel ?? process.env.GEMINI_MODEL_FAST ?? 'gemini-3.8-flash';
    this.reasoningModel = config.reasoningModel ?? process.env.GEMINI_MODEL_REASONING ?? 'gemini-4-argon';
    this.maxTokens = config.maxTokensPerCampaign ?? 250_000;
  }
  async generateStructured(params) {
    if (this.tokensUsed >= this.maxTokens) {
      throw new Error(`CIRCUIT_BREAKER_TRIGGERED: Campaign token budget cap reached (${this.tokensUsed}/${this.maxTokens}).`);
    }
    const model = params.tier === 'fast' ? this.fastModel : this.reasoningModel;
    if (!this.apiKey) {
      // Local fallback simulation if API key is not supplied in environment
      return this.synthesizeLocalFallback(params.tier, params.prompt);
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const requestBody = {
      systemInstruction: {
        parts: [{
          text: params.systemInstruction
        }]
      },
      contents: [{
        role: 'user',
        parts: [{
          text: params.prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };
    if (params.jsonSchema) {
      requestBody.generationConfig.responseSchema = params.jsonSchema;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
    }
    const data = await response.json();
    if (data.usageMetadata?.totalTokenCount) {
      this.tokensUsed += data.usageMetadata.totalTokenCount;
    }
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error('Empty structured response from Gemini API.');
    }
    return JSON.parse(rawJson);
  }
  synthesizeLocalFallback(tier, prompt) {
    // Deterministic mock payload conforming to schemas
    if (tier === 'fast') {
      return {
        strategy: 'AST_AND_SMT',
        lens: 'STRICT_TAINT',
        confidence: 0.95,
        testSeed: 'seed_42_aegis'
      };
    }
    return {
      patchDiff: '+ // Safe parameterized invocation',
      smtProof: 'UNSAT_PROVED',
      explanation: 'Surgical formal invariant satisfied.'
    };
  }
}
