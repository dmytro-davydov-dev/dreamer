import { callLlm, LlmError } from "./llmClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResponse(
  status: number,
  body: unknown,
  options: { bodyIsText?: boolean } = {}
): Response {
  const bodyStr = options.bodyIsText
    ? (body as string)
    : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(bodyStr),
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function makeOpenAiResponse(content: string): unknown {
  return {
    choices: [{ message: { content } }],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("callLlm", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // jsdom does not polyfill fetch; assign directly to global
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.fetch;
  });

  // ── Happy paths ──────────────────────────────────────────────────────────

  it("returns parsed JSON when jsonSchema is provided and model returns valid JSON", async () => {
    const payload = { elements: [{ kind: "symbol", label: "key", evidence: [] }] };
    const rawContent = JSON.stringify(payload);

    fetchMock.mockResolvedValue(
      makeResponse(200, makeOpenAiResponse(rawContent))
    );

    const result = await callLlm({
      apiKey: "sk-test",
      messages: [{ role: "user", content: "extract" }],
      jsonSchema: {
        name: "test_schema",
        schema: { type: "object", properties: {}, required: [], additionalProperties: false },
      },
    });

    expect(result).toEqual(payload);
  });

  it("returns raw string content when jsonSchema is not provided", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(200, makeOpenAiResponse("hello world"))
    );

    const result = await callLlm({
      apiKey: "sk-test",
      messages: [{ role: "user", content: "say hello" }],
    });

    expect(result).toBe("hello world");
  });

  it("sends correct Authorization header and model in body", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(200, makeOpenAiResponse("ok"))
    );

    await callLlm({
      apiKey: "sk-my-key",
      model: "gpt-4o",
      messages: [{ role: "user", content: "ping" }],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/chat/completions");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer sk-my-key");

    const bodyParsed = JSON.parse(init.body as string) as { model: string };
    expect(bodyParsed.model).toBe("gpt-4o");
  });

  it("uses custom baseUrl when provided", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(200, makeOpenAiResponse("ok"))
    );

    await callLlm({
      apiKey: "sk-test",
      baseUrl: "https://custom.api.example.com/v1",
      messages: [{ role: "user", content: "test" }],
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://custom.api.example.com/v1/chat/completions");
  });

  // ── Error: 401 invalid key ───────────────────────────────────────────────

  it("throws LlmError(invalid_key) on 401", async () => {
    fetchMock.mockResolvedValue(makeResponse(401, "Unauthorized", { bodyIsText: true }));

    await expect(
      callLlm({ apiKey: "bad-key", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "invalid_key", statusCode: 401 });
  });

  // ── Error: 429 rate limit ────────────────────────────────────────────────

  it("throws LlmError(rate_limit) on 429 without quota mention", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(429, { error: { message: "Too many requests" } })
    );

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "rate_limit", statusCode: 429 });
  });

  it("throws LlmError(quota_exceeded) on 429 when body contains 'quota'", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(429, "You exceeded your current quota", { bodyIsText: true })
    );

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "quota_exceeded", statusCode: 429 });
  });

  // ── Error: 404 model not found ───────────────────────────────────────────

  it("throws LlmError(model_not_found) on 404", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(404, { error: { message: "model not found" } })
    );

    await expect(
      callLlm({ apiKey: "sk-test", model: "gpt-99", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "model_not_found", statusCode: 404 });
  });

  // ── Error: generic API error ─────────────────────────────────────────────

  it("throws LlmError(api_error) on 500", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(500, "Internal Server Error", { bodyIsText: true })
    );

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "api_error", statusCode: 500 });
  });

  // ── Error: network failure ───────────────────────────────────────────────

  it("throws LlmError(network) when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "network" });
  });

  // ── Error: response body not valid JSON ──────────────────────────────────

  it("throws LlmError(parse_error) when response.json() rejects", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    } as unknown as Response);

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "parse_error" });
  });

  // ── Error: choices missing ───────────────────────────────────────────────

  it("throws LlmError(parse_error) when choices array is missing", async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { object: "error" }));

    await expect(
      callLlm({ apiKey: "sk-test", messages: [{ role: "user", content: "x" }] })
    ).rejects.toMatchObject({ kind: "parse_error" });
  });

  // ── Error: content is invalid JSON when jsonSchema requested ────────────

  it("throws LlmError(parse_error) when content is not valid JSON but jsonSchema requested", async () => {
    fetchMock.mockResolvedValue(
      makeResponse(200, makeOpenAiResponse("this is not json {{{"))
    );

    await expect(
      callLlm({
        apiKey: "sk-test",
        messages: [{ role: "user", content: "x" }],
        jsonSchema: {
          name: "schema",
          schema: { type: "object", properties: {}, required: [], additionalProperties: false },
        },
      })
    ).rejects.toMatchObject({ kind: "parse_error" });
  });

  // ── LlmError class ──────────────────────────────────────────────────────

  it("LlmError has correct name and properties", () => {
    const err = new LlmError("invalid_key", "bad key", 401);
    expect(err.name).toBe("LlmError");
    expect(err.kind).toBe("invalid_key");
    expect(err.message).toBe("bad key");
    expect(err.statusCode).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});
