import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testSearchToolConnection } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import SearchConnectionTest from "./SearchConnectionTest";

vi.mock("@/components/networking", () => ({ testSearchToolConnection: vi.fn() }));

const mockTest = vi.mocked(testSearchToolConnection);

const tavilyParams = { search_provider: "tavily" };
const paramsWithoutProvider = {};
const successWithQuery = { status: "success", message: "ok", test_query: "hello world", results_count: 3 };

const renderTest = (litellmParams: Record<string, unknown> = tavilyParams) =>
  renderWithProviders(<SearchConnectionTest litellmParams={litellmParams} accessToken="sk-test" />);

describe("SearchConnectionTest Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state naming the provider with the English original absent", () => {
    mockTest.mockReturnValue(new Promise(() => {}));
    renderTest();

    expect(screen.getByText("正在测试与 tavily 的连接...")).toBeInTheDocument();
    expect(screen.queryByText("Testing connection to tavily...")).not.toBeInTheDocument();
  });

  it("renders the Chinese search-provider fallback while loading with the English original absent", () => {
    mockTest.mockReturnValue(new Promise(() => {}));
    renderTest(paramsWithoutProvider);

    expect(screen.getByText("正在测试与 搜索提供方 的连接...")).toBeInTheDocument();
    expect(screen.queryByText("Testing connection to search provider...")).not.toBeInTheDocument();
  });

  it("renders the Chinese success state with the test query and result count", async () => {
    mockTest.mockResolvedValue(successWithQuery);
    renderTest();

    expect(await screen.findByText("已成功连接到 tavily！")).toBeInTheDocument();
    expect(screen.queryByText("Connection to tavily successful!")).not.toBeInTheDocument();
    expect(screen.getByText("测试查询：")).toBeInTheDocument();
    expect(screen.queryByText("Test query:")).not.toBeInTheDocument();
    expect(screen.getByText("已获取结果数：3")).toBeInTheDocument();
    expect(screen.queryByText("Results retrieved: 3")).not.toBeInTheDocument();

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("连接测试成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Connection test successful!");
  });

  it("renders the Chinese failure state with the error label, type and troubleshooting tips", async () => {
    mockTest.mockResolvedValue({
      status: "error",
      message: "litellm.AuthenticationError: Invalid API key\nstack trace: deep internals",
      error_type: "AuthenticationError",
    });
    renderTest();

    expect(await screen.findByText("连接到 tavily 失败")).toBeInTheDocument();
    expect(screen.queryByText("Connection to tavily failed")).not.toBeInTheDocument();
    expect(screen.getByText("错误：")).toBeInTheDocument();
    expect(screen.queryByText("Error:")).not.toBeInTheDocument();
    expect(screen.getByText("错误类型：")).toBeInTheDocument();
    expect(screen.queryByText("Error type:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "显示详情" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Details" })).not.toBeInTheDocument();
    expect(screen.getByText("故障排查提示：")).toBeInTheDocument();
    expect(screen.queryByText("Troubleshooting tips:")).not.toBeInTheDocument();

    expect(screen.getByText("验证你的 API key 是否正确且有效")).toBeInTheDocument();
    expect(screen.queryByText("Verify your API key is correct and active")).not.toBeInTheDocument();
    expect(screen.getByText("检查搜索提供方服务是否正常运行")).toBeInTheDocument();
    expect(screen.queryByText("Check if the search provider service is operational")).not.toBeInTheDocument();
    expect(screen.getByText("确保你在该提供方处有足够的额度/配额")).toBeInTheDocument();
    expect(screen.queryByText("Ensure you have sufficient credits/quota with the provider")).not.toBeInTheDocument();
    expect(screen.getByText("查看提供方的文档以了解任何其他要求")).toBeInTheDocument();
    expect(
      screen.queryByText("Review the provider's documentation for any additional requirements"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese failure fallback naming the search provider with the English original absent", async () => {
    mockTest.mockResolvedValue({ status: "error", message: "boom" });
    renderTest(paramsWithoutProvider);

    expect(await screen.findByText("连接到 搜索提供方 失败")).toBeInTheDocument();
    expect(screen.queryByText("Connection to search provider failed")).not.toBeInTheDocument();
  });

  it("reveals the Chinese full error details and toggles to the Chinese hide label", async () => {
    mockTest.mockResolvedValue({
      status: "error",
      message: "litellm.AuthenticationError: Invalid API key\nstack trace: deep internals",
      error_type: "AuthenticationError",
    });
    renderTest();

    const toggle = await screen.findByRole("button", { name: "显示详情" });
    expect(screen.queryByText("完整错误详情")).not.toBeInTheDocument();

    const user = userEvent.setup({ delay: null });
    await user.click(toggle);

    expect(await screen.findByText("完整错误详情")).toBeInTheDocument();
    expect(screen.queryByText("Full Error Details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "隐藏详情" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide Details" })).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown-error message when the request rejects without an Error", async () => {
    mockTest.mockRejectedValue("boom");
    renderTest();

    expect(await screen.findByText("发生未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error occurred")).not.toBeInTheDocument();
  });

  it("renders the Chinese short unknown-error message when the failure carries no message", async () => {
    mockTest.mockResolvedValue({ status: "error", message: "" });
    renderTest();

    expect(await screen.findByText("未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-key message for a 401 html body", async () => {
    mockTest.mockResolvedValue({ status: "error", message: "<html>401</html>" });
    renderTest();

    expect(await screen.findByText("认证失败：API key 或凭证无效")).toBeInTheDocument();
    expect(screen.queryByText("Authentication failed: Invalid API key or credentials")).not.toBeInTheDocument();
  });

  it("renders the Chinese authentication message for a non-401 html body", async () => {
    mockTest.mockResolvedValue({ status: "error", message: "<html>oops</html>" });
    renderTest();

    expect(await screen.findByText("认证错误 - 请检查你的 API key")).toBeInTheDocument();
    expect(screen.queryByText("Authentication error - please check your API key")).not.toBeInTheDocument();
  });

  it("links to the search documentation with the Chinese label", async () => {
    mockTest.mockResolvedValue({ status: "success", message: "ok" });
    renderTest();

    const link = await screen.findByRole("link", { name: "查看搜索文档" });
    expect(link).toHaveAttribute("href", "https://docs.litellm.ai/docs/search");
    expect(screen.queryByRole("link", { name: "View Search Documentation" })).not.toBeInTheDocument();
  });
});
