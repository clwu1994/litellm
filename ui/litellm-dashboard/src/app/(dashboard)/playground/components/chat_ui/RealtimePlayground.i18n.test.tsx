import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import RealtimePlayground from "./RealtimePlayground";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "https://proxy.example.com",
}));

class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;

  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });

  constructor(
    public url: string,
    public protocols?: string[],
  ) {
    FakeSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  emit(message: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const latestSocket = () => FakeSocket.instances[FakeSocket.instances.length - 1];

const makeAudioContext = () =>
  class {
    currentTime = 0;
    destination = {};
    sampleRate = 24000;
    close = vi.fn();
    createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(1), duration: 0 }));
    createBufferSource = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), buffer: null }));
    createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
    createScriptProcessor = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null }));
  };

const props = { accessToken: "sk-realtime", selectedModel: "gpt-realtime" };

describe("RealtimePlayground Chinese copy", () => {
  beforeEach(async () => {
    FakeSocket.instances = [];
    await i18n.changeLanguage("zh");
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal("AudioContext", makeAudioContext());
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.unstubAllGlobals();
  });

  it("renders the Chinese disconnected chrome, voice label and invitation", () => {
    render(<RealtimePlayground {...props} />);

    expect(screen.getByText("实时语音对话")).toBeInTheDocument();
    expect(screen.queryByText("Realtime Voice Chat")).not.toBeInTheDocument();
    expect(screen.getByText("已断开连接")).toBeInTheDocument();
    expect(screen.queryByText("Disconnected")).not.toBeInTheDocument();
    expect(screen.getByText("实时语音 Playground")).toBeInTheDocument();
    expect(screen.queryByText("Realtime Voice Playground")).not.toBeInTheDocument();

    expect(screen.getByLabelText("音色")).toBeInTheDocument();
    expect(screen.queryByLabelText("Voice")).not.toBeInTheDocument();
    expect(screen.getByText("Alloy - 专业而自信")).toBeInTheDocument();
    expect(screen.queryByText("Alloy - Professional and confident")).not.toBeInTheDocument();

    expect(
      screen.getByText("开始实时会话。你可以使用麦克风说话或输入消息。AI 将以语音和文本回复。", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("连接", { selector: "b" })).toBeInTheDocument();
    expect(screen.queryByText("Connect", { selector: "b" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "to start a realtime session. You can speak using your microphone or type messages. The AI will respond with voice and text.",
        { exact: false },
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-model status", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RealtimePlayground {...props} selectedModel="" />);

    await user.click(screen.getByRole("button", { name: "连接" }));
    expect(screen.getByText("请先选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Please select a model first")).not.toBeInTheDocument();
  });

  it("renders the Chinese connected chrome and input controls", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: "连接" }));
    expect(screen.getByText("正在连接...")).toBeInTheDocument();
    expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
    await act(async () => {
      latestSocket().open();
    });

    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByText("已连接到 realtime API")).toBeInTheDocument();
    expect(screen.queryByText("Connected to realtime API")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入消息或使用麦克风...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type a message or use the mic...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "断开连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
    expect(screen.getByTitle("开始录音")).toBeInTheDocument();
    expect(screen.queryByTitle("Start recording")).not.toBeInTheDocument();
    expect(screen.getByLabelText("发送")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send")).not.toBeInTheDocument();
  });

  it("renders the Chinese error frames and disconnection status", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: "连接" }));
    await act(async () => {
      latestSocket().open();
      latestSocket().emit({ type: "error", error: { message: "rate limited" } });
    });
    expect(screen.getByText("错误：rate limited")).toBeInTheDocument();
    expect(screen.queryByText("Error: rate limited")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "断开连接" }));
    expect(screen.getByRole("button", { name: "连接" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "连接" }));
    await act(async () => {
      latestSocket().open();
      latestSocket().onerror?.();
    });
    expect(screen.getByText("WebSocket 错误")).toBeInTheDocument();
    expect(screen.queryByText("WebSocket error")).not.toBeInTheDocument();
  });

  it("renders the Chinese user and AI role labels", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: "连接" }));
    await act(async () => {
      latestSocket().open();
    });

    fireEvent.change(screen.getByPlaceholderText("输入消息或使用麦克风..."), { target: { value: "hello" } });
    await user.click(screen.getByLabelText("发送"));
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();

    await act(async () => {
      latestSocket().emit({ type: "response.output_text.delta", delta: "hi" });
    });
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("hi")).toBeInTheDocument();
  });

  it("renders the Chinese recording chrome", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: "连接" }));
    await act(async () => {
      latestSocket().open();
    });

    await user.click(screen.getByTitle("开始录音"));
    expect(await screen.findByText("🎙️ 正在聆听...")).toBeInTheDocument();
    expect(screen.queryByText("🎙️ Listening...")).not.toBeInTheDocument();
    expect(screen.getByTitle("停止录音")).toBeInTheDocument();
    expect(screen.getByText("正在聆听，请对着麦克风说话。Server VAD 会在你停止时自动检测。")).toBeInTheDocument();
    expect(
      screen.queryByText("Listening — speak into your microphone. Server VAD will detect when you stop."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese microphone and connection failure statuses", async () => {
    const user = userEvent.setup({ delay: null });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("denied"));

    render(<RealtimePlayground {...props} />);
    await user.click(screen.getByRole("button", { name: "连接" }));
    await act(async () => {
      latestSocket().open();
    });
    await user.click(screen.getByTitle("开始录音"));
    expect(await screen.findByText("麦克风错误：denied")).toBeInTheDocument();
    expect(screen.queryByText("Microphone error: denied")).not.toBeInTheDocument();
  });

  it("renders the Chinese connection failure status", async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("no audio");
        }
      },
    );

    render(<RealtimePlayground {...props} />);
    await user.click(screen.getByRole("button", { name: "连接" }));
    expect(await screen.findByText("连接失败：no audio")).toBeInTheDocument();
    expect(screen.queryByText("Connection failed: no audio")).not.toBeInTheDocument();
  });
});
