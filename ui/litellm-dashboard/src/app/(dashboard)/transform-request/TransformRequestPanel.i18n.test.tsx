import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import TransformRequestPanel from "./TransformRequestPanel";
import { transformRequestCall } from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  transformRequestCall: vi.fn(),
}));

const transformRequestCallMock = vi.mocked(transformRequestCall);
const notify = vi.mocked(toast);

const ACCESS_TOKEN = "sk-test-token";

const renderPanel = (accessToken: string | null = ACCESS_TOKEN) =>
  renderWithProviders(<TransformRequestPanel accessToken={accessToken} />);

const getTransformButton = () => screen.getByRole("button", { name: "转换" });

const getRequestTextarea = () => screen.getByPlaceholderText("按 Cmd/Ctrl + Enter 进行转换");

const footerMatcher = (sentence: string) => (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === sentence;

const getFooterParagraph = (sentence: string) => screen.getByText(footerMatcher(sentence));

const queryFooterParagraph = (sentence: string) => screen.queryByText(footerMatcher(sentence));

describe("TransformRequestPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header and card copy and hides the English originals", () => {
    renderPanel();

    expect(screen.getByRole("heading", { name: "Playground" })).toBeInTheDocument();

    expect(screen.getByText("了解 LiteLLM 如何为指定的提供商转换你的请求。")).toBeInTheDocument();
    expect(
      screen.queryByText("See how LiteLLM transforms your request for the specified provider."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("原始请求")).toBeInTheDocument();
    expect(screen.queryByText("Original Request")).not.toBeInTheDocument();
    expect(screen.getByText("你将发送到 LiteLLM /chat/completions Endpoint 的请求。")).toBeInTheDocument();
    expect(
      screen.queryByText("The request you would send to LiteLLM /chat/completions endpoint."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("转换后的请求")).toBeInTheDocument();
    expect(screen.queryByText("Transformed Request")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 如何为指定的提供商转换你的请求。")).toBeInTheDocument();
    expect(
      screen.queryByText("How LiteLLM transforms your request for the specified provider."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("注意：不会显示敏感请求头。")).toBeInTheDocument();
    expect(screen.queryByText("Note: Sensitive headers are not shown.")).not.toBeInTheDocument();
  });

  it("renders the Chinese textarea placeholder and transform button and hides the English originals", () => {
    renderPanel();

    expect(getRequestTextarea()).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Press Cmd/Ctrl + Enter to transform")).not.toBeInTheDocument();

    expect(getTransformButton()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Transform" })).not.toBeInTheDocument();
  });

  it("renders the Chinese copy label and footer link and hides the English originals", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: "复制到剪贴板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy to clipboard" })).not.toBeInTheDocument();

    expect(getFooterParagraph("发现问题？请在此处提交 issue。")).toBeInTheDocument();
    expect(queryFooterParagraph("Found an error? File an issue here.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "此处" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm/issues",
    );
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();
  });

  it("reports invalid JSON in Chinese", async () => {
    const user = userEvent.setup();
    renderPanel();

    const textarea = getRequestTextarea();
    await user.clear(textarea);
    await user.type(textarea, "not json");
    await user.click(getTransformButton());

    await waitFor(() => expect(notify.fromError).toHaveBeenCalledWith("请求体中的 JSON 无效"));
    expect(notify.fromError).not.toHaveBeenCalledWith("Invalid JSON in request body");
    expect(transformRequestCallMock).not.toHaveBeenCalled();
  });

  it("reports the missing access token in Chinese", async () => {
    const user = userEvent.setup();
    renderPanel(null);

    await user.click(getTransformButton());

    await waitFor(() => expect(notify.fromError).toHaveBeenCalledWith("未找到 access token"));
    expect(notify.fromError).not.toHaveBeenCalledWith("No access token found");
    expect(transformRequestCallMock).not.toHaveBeenCalled();
  });

  it("reports a successful transform and a copy in Chinese", async () => {
    const user = userEvent.setup();
    transformRequestCallMock.mockResolvedValue({
      raw_request_api_base: "https://api.anthropic.com/v1/messages",
      raw_request_body: { model: "claude-opus-4-8" },
      raw_request_headers: {},
    });

    renderPanel();
    await user.click(getTransformButton());
    await screen.findByText(/api\.anthropic\.com\/v1\/messages/);

    expect(notify.success).toHaveBeenCalledWith("请求转换成功");
    expect(notify.success).not.toHaveBeenCalledWith("Request transformed successfully");

    await user.click(screen.getByRole("button", { name: "复制到剪贴板" }));

    expect(notify.success).toHaveBeenCalledWith("已复制到剪贴板");
    expect(notify.success).not.toHaveBeenCalledWith("Copied to clipboard");
  });

  it("reports an unexpected response format in Chinese", async () => {
    const user = userEvent.setup();
    transformRequestCallMock.mockResolvedValue({});

    renderPanel();
    await user.click(getTransformButton());

    await waitFor(() => expect(notify.info).toHaveBeenCalledWith("收到的转换后请求格式不符合预期"));
    expect(notify.info).not.toHaveBeenCalledWith("Transformed request received in unexpected format");
  });

  it("reports a failed transform in Chinese", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    transformRequestCallMock.mockRejectedValue(new Error("boom"));

    renderPanel();
    await user.click(getTransformButton());

    await waitFor(() => expect(notify.fromError).toHaveBeenCalledWith("转换请求失败"));
    expect(notify.fromError).not.toHaveBeenCalledWith("Failed to transform request");
  });
});

describe("TransformRequestPanel English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    renderPanel();

    expect(screen.getByRole("heading", { name: "Playground" })).toBeInTheDocument();
    expect(screen.getByText("See how LiteLLM transforms your request for the specified provider.")).toBeInTheDocument();
    expect(screen.getByText("Original Request")).toBeInTheDocument();
    expect(screen.getByText("The request you would send to LiteLLM /chat/completions endpoint.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Press Cmd/Ctrl + Enter to transform")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Transform" })).toBeInTheDocument();
    expect(screen.getByText("Transformed Request")).toBeInTheDocument();
    expect(screen.getByText("How LiteLLM transforms your request for the specified provider.")).toBeInTheDocument();
    expect(screen.getByText("Note: Sensitive headers are not shown.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
    expect(getFooterParagraph("Found an error? File an issue here.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "here" })).toBeInTheDocument();
  });
});
