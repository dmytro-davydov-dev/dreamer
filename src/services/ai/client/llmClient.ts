/**
 * src/services/ai/client/llmClient.ts
 *
 * Minimal, fetch-based OpenAI-compatible client.
 * No external SDK dependency — keeps the bundle small and stays provider-agnostic.
 */

export type LlmMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export interface LlmCallOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  messages: LlmMessage[];
  /** If provided, response_format will request JSON structured output */
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
  temperature?: number;
  maxTokens?: number;
}

export type LlmErrorKind =
  | "invalid_key"
  | "rate_limit"
  | "quota_exceeded"
  | "model_not_found"
  | "network"
  | "parse_error"
  | "api_error";

export class LlmError extends Error {
  constructor(
    public readonly kind: LlmErrorKind,
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "LlmError";
  }
}

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

/**
 * Call the LLM and return the parsed JSON response content.
 * Throws `LlmError` on any failure.
 */
export async function callLlm<T = unknown>(options: LlmCallOptions): Promise<T> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    baseUrl = DEFAULT_BASE_URL,
    messages,
    jsonSchema,
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonSchema) {
    body["response_format"] = {
      type: "json_schema",
      json_schema: {
        name: jsonSchema.name,
        strict: jsonSchema.strict ?? true,
        schema: jsonSchema.schema,
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LlmError("network", `Network error: ${String(err)}`);
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }

    const status = response.status;
    if (status === 401) {
      throw new LlmError("invalid_key", "Invalid API key. Check your key in Settings.", status);
    }
    if (status === 429) {
      const isQuota = errorBody.toLowerCase().includes("quota");
      throw new LlmError(
        isQuota ? "quota_exceeded" : "rate_limit",
        isQuota
          ? "API quota exceeded. Check your plan limits."
          : "Rate limit reached. Please wait a moment and try again.",
        status
      );
    }
    if (status === 404) {
      throw new LlmError("model_not_found", `Model not found: ${model}`, status);
    }
    throw new LlmError("api_error", `API error ${status}: ${errorBody}`, status);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (err) {
    throw new LlmError("parse_error", `Failed to parse API response: ${String(err)}`);
  }

  const content = (json as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new LlmError("parse_error", "Unexpected response shape from API.");
  }

  if (jsonSchema) {
    try {
      return JSON.parse(content) as T;
    } catch (err) {
      throw new LlmError("parse_error", `Failed to parse JSON from model: ${String(err)}`);
    }
  }

  return content as unknown as T;
}
