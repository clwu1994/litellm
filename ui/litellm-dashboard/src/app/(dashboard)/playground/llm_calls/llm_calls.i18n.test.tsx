import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import OpenAI from "openai";
import { makeA2AStreamMessageRequest } from "./a2a_send_message";
import { makeAnthropicMessagesRequest } from "./anthropic_messages";
import { makeOpenAIAudioSpeechRequest } from "./audio_speech";
import { makeOpenAIAudioTranscriptionRequest } from "./audio_transcriptions";
import { makeOpenAIEmbeddingsRequest } from "./embeddings_api";
import { makeOpenAIImageEditsRequest } from "./image_edits";
import { makeOpenAIImageGenerationRequest } from "./image_generation";
import { makeInteractionsRequest } from "./interactions_api";

vi.mock("openai");

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
  getGlobalLitellmHeaderName: vi.fn(() => "Authorization"),
}));

const anthropicStream = vi.fn();
const anthropicCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () {
    return { messages: { stream: anthropicStream, create: anthropicCreate } };
  }),
}));

const t = i18n.getFixedT("zh", "playground");

const speechCreate = vi.fn();
const transcriptionCreate = vi.fn();
const imageGenerate = vi.fn();
const imageEdit = vi.fn();

const readerFor = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    read: async () =>
      index < chunks.length
        ? { done: false, value: encoder.encode(chunks[index++]) }
        : { done: true, value: undefined },
  };
};

const captureError = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("expected the request to reject");
};

describe("playground llm_calls Chinese toasts and errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (OpenAI as unknown as { mockImplementation: (fn: () => unknown) => void }).mockImplementation(function () {
      return {
        audio: { speech: { create: speechCreate }, transcriptions: { create: transcriptionCreate } },
        images: { generate: imageGenerate, edit: imageEdit },
      };
    });
    global.URL.createObjectURL = vi.fn(() => "blob:mock-audio-url");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Chinese Anthropic request error toast", async () => {
    anthropicStream.mockImplementation(() => {
      throw new Error("boom");
    });

    await captureError(makeAnthropicMessagesRequest([{ role: "user", content: "hi" }], vi.fn(), "claude", "sk-key", t));

    expect(toast.fromError).toHaveBeenCalledWith("生成模型响应时出错。请重试。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while generating model response. Please try again. Error: Error: boom",
    );
  });

  it("renders the Chinese Virtual Key required error", async () => {
    const message = await captureError(
      makeAnthropicMessagesRequest([{ role: "user", content: "hi" }], vi.fn(), "claude", null, t),
    );

    expect(message).toBe("Virtual Key 为必填项");
    expect(message).not.toBe("Virtual Key is required");
  });

  it("renders the Chinese speech error toast", async () => {
    speechCreate.mockRejectedValue(new Error("boom"));

    await captureError(makeOpenAIAudioSpeechRequest("hello", "alloy", vi.fn(), "tts-1", "sk-key", t, []));

    expect(toast.fromError).toHaveBeenCalledWith("生成语音时出错。请重试。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while generating speech. Please try again. Error: Error: boom",
    );
  });

  it("renders the Chinese transcription success toast", async () => {
    transcriptionCreate.mockResolvedValue({ text: "hello" });

    await makeOpenAIAudioTranscriptionRequest(
      new File(["a"], "clip.wav", { type: "audio/wav" }),
      vi.fn(),
      "whisper-1",
      "sk-key",
      t,
      [],
    );

    expect(toast.success).toHaveBeenCalledWith("音频转写成功");
    expect(toast.success).not.toHaveBeenCalledWith("Audio transcribed successfully");
  });

  it("renders the Chinese missing-transcription-text error", async () => {
    transcriptionCreate.mockResolvedValue({});

    const message = await captureError(
      makeOpenAIAudioTranscriptionRequest(
        new File(["a"], "clip.wav", { type: "audio/wav" }),
        vi.fn(),
        "whisper-1",
        "sk-key",
        t,
        [],
      ),
    );

    expect(message).toBe("响应中没有转写文本");
    expect(message).not.toBe("No transcription text in response");
  });

  it("renders the Chinese transcription failure toast with the Chinese fallback", async () => {
    transcriptionCreate.mockRejectedValue("boom");

    await captureError(
      makeOpenAIAudioTranscriptionRequest(
        new File(["a"], "clip.wav", { type: "audio/wav" }),
        vi.fn(),
        "whisper-1",
        "sk-key",
        t,
        [],
      ),
    );

    expect(toast.fromError).toHaveBeenCalledWith("音频转写失败：转写音频失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Audio transcription failed: Failed to transcribe audio");
  });

  it("renders the Chinese embeddings error toast", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("boom")) as unknown as typeof fetch;

    await captureError(makeOpenAIEmbeddingsRequest("hi", vi.fn(), "text-embedding-3-small", "sk-key", t, []));

    expect(toast.fromError).toHaveBeenCalledWith("发起 Embeddings 请求时出错。请重试。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while making embeddings request. Please try again. Error: Error: boom",
    );
  });

  it("renders the Chinese missing-embedding error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{}] }),
      text: async () => "",
    }) as unknown as typeof fetch;

    const message = await captureError(
      makeOpenAIEmbeddingsRequest("hi", vi.fn(), "text-embedding-3-small", "sk-key", t, []),
    );

    expect(message).toBe("服务器未返回 Embedding");
    expect(message).not.toBe("No embedding returned from server");
  });

  it("renders the Chinese image-edit success toast with the plural count", async () => {
    imageEdit.mockResolvedValue({ data: [{ url: "https://example.com/a.png" }] });

    await makeOpenAIImageEditsRequest(
      [new File(["a"], "a.png", { type: "image/png" }), new File(["b"], "b.png", { type: "image/png" })],
      "edit",
      vi.fn(),
      "dall-e-3",
      "sk-key",
      t,
      [],
    );

    expect(toast.success).toHaveBeenCalledWith("成功处理 2 张图片");
    expect(toast.success).not.toHaveBeenCalledWith("Successfully processed 2 images");
  });

  it("renders the Chinese image-edit failure toast with the Chinese fallback", async () => {
    imageEdit.mockRejectedValue("boom");

    await captureError(
      makeOpenAIImageEditsRequest(
        new File(["a"], "a.png", { type: "image/png" }),
        "edit",
        vi.fn(),
        "dall-e-3",
        "sk-key",
        t,
        [],
      ),
    );

    expect(toast.fromError).toHaveBeenCalledWith("图片编辑失败：编辑图片失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Image edit failed: Failed to edit image(s)");
  });

  it("renders the Chinese image-generation error toast", async () => {
    imageGenerate.mockRejectedValue(new Error("boom"));

    await captureError(makeOpenAIImageGenerationRequest("a cat", vi.fn(), "dall-e-3", "sk-key", t, []));

    expect(toast.fromError).toHaveBeenCalledWith("生成图片时出错。请重试。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while generating image. Please try again. Error: Error: boom",
    );
  });

  it("renders the Chinese missing-image-data error", async () => {
    imageGenerate.mockResolvedValue({ data: [{}] });

    const message = await captureError(makeOpenAIImageGenerationRequest("a cat", vi.fn(), "dall-e-3", "sk-key", t, []));

    expect(message).toBe("响应中未找到图片数据");
    expect(message).not.toBe("No image data found in response");
  });

  it("renders the Chinese invalid-response-format error", async () => {
    imageGenerate.mockResolvedValue({ data: [] });

    const message = await captureError(makeOpenAIImageGenerationRequest("a cat", vi.fn(), "dall-e-3", "sk-key", t, []));

    expect(message).toBe("响应格式无效");
    expect(message).not.toBe("Invalid response format");
  });

  it("renders the Chinese missing-response-body error for the Interactions API", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: null }) as unknown as typeof fetch;

    const message = await captureError(makeInteractionsRequest("hi", vi.fn(), "gemini", "sk-key", t, []));

    expect(message).toBe("未收到响应体");
    expect(message).not.toBe("No response body received");
  });

  it("renders the Chinese Interactions API error toast", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("boom")) as unknown as typeof fetch;

    await captureError(makeInteractionsRequest("hi", vi.fn(), "gemini", "sk-key", t, []));

    expect(toast.fromError).toHaveBeenCalledWith("发起 Interactions API 请求时出错。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while making Interactions API request. Error: Error: boom",
    );
  });

  it("renders the Chinese missing-response-body error for the A2A stream", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: null }) as unknown as typeof fetch;

    const message = await captureError(makeA2AStreamMessageRequest("agent-1", "hi", vi.fn(), "sk-key", t));

    expect(message).toBe("没有响应体");
    expect(message).not.toBe("No response body");
  });

  it("renders the Chinese unknown-A2A-error fallback", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => readerFor(['{"error":{}}\n']) },
    }) as unknown as typeof fetch;

    const message = await captureError(makeA2AStreamMessageRequest("agent-1", "hi", vi.fn(), "sk-key", t));

    expect(message).toBe("未知的 A2A 错误");
    expect(message).not.toBe("Unknown A2A error");
  });
});
