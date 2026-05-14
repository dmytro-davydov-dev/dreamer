/**
 * src/services/ai/client/whisperClient.ts
 *
 * Thin client for OpenAI Whisper audio transcription.
 * Accepts a recorded audio Blob and returns the transcribed text.
 */

export interface WhisperTranscribeOptions {
  apiKey: string;
  audioBlob: Blob;
  /** BCP-47 language hint, e.g. "uk" for Ukrainian. Omit to auto-detect. */
  language?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

/**
 * Send an audio blob to Whisper and return the transcript string.
 * Throws a plain Error with a human-readable message on failure.
 */
export async function transcribeAudio(options: WhisperTranscribeOptions): Promise<string> {
  const { apiKey, audioBlob, language = "uk", baseUrl = DEFAULT_BASE_URL } = options;

  const formData = new FormData();
  // Whisper accepts webm, mp4, wav, etc. We label it with a filename so the API
  // can infer the container format from the extension.
  const ext = audioBlob.type.includes("ogg")
    ? "ogg"
    : audioBlob.type.includes("mp4")
      ? "mp4"
      : "webm";
  formData.append("file", audioBlob, `recording.${ext}`);
  formData.append("model", "whisper-1");
  if (language) formData.append("language", language);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
  } catch (err) {
    throw new Error(`Network error while transcribing audio: ${String(err)}`);
  }

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Check your key in Settings.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit reached. Please wait a moment and try again.");
    }
    throw new Error(`Whisper API error ${response.status}: ${detail}`);
  }

  const json = (await response.json()) as { text?: string };
  if (typeof json.text !== "string") {
    throw new Error("Unexpected response from Whisper API.");
  }

  return json.text.trim();
}
