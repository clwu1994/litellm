import { describe, it, expect, vi, beforeEach } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { getCurlCommand, runSemanticFilterTest as runSemanticFilterTestWithT } from "./semanticFilterTestUtils";
import { testMCPSemanticFilter } from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  testMCPSemanticFilter: vi.fn(),
}));

const en = i18n.getFixedT("en", "mcpServers");
const zh = i18n.getFixedT("zh", "mcpServers");

// The helper takes the translation function so it never reaches for the global singleton. This
// wrapper keeps every existing assertion on the English copy; the last block pins the Chinese.
const runSemanticFilterTest = (
  args: Omit<Parameters<typeof runSemanticFilterTestWithT>[0], "t">,
): ReturnType<typeof runSemanticFilterTestWithT> => runSemanticFilterTestWithT({ ...args, t: en });

describe("getCurlCommand", () => {
  it("should include the model name in the curl command", () => {
    const result = getCurlCommand("gpt-4o", "test query");
    expect(result).toContain('"gpt-4o"');
  });

  it("should include the query in the curl command", () => {
    const result = getCurlCommand("gpt-4o", "find relevant files");
    expect(result).toContain("find relevant files");
  });

  it("should use a placeholder when query is empty", () => {
    const result = getCurlCommand("gpt-4o", "");
    expect(result).toContain("Your query here");
  });
});

describe("runSemanticFilterTest", () => {
  const mockSetIsTesting = vi.fn();
  const mockSetTestResult = vi.fn();
  const mockSetTestError = vi.fn();
  const baseArgs = {
    accessToken: "test-token",
    testModel: "gpt-4o",
    testQuery: "find relevant files",
    setIsTesting: mockSetIsTesting,
    setTestResult: mockSetTestResult,
    setTestError: mockSetTestError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.error and not set isTesting when testQuery is empty", async () => {
    await runSemanticFilterTest({ ...baseArgs, testQuery: "" });
    expect(toast.error).toHaveBeenCalledWith("Please enter a query and select a model");
    expect(mockSetIsTesting).not.toHaveBeenCalled();
  });

  it("should call toast.error and not set isTesting when testModel is empty", async () => {
    await runSemanticFilterTest({ ...baseArgs, testModel: "" });
    expect(toast.error).toHaveBeenCalledWith("Please enter a query and select a model");
    expect(mockSetIsTesting).not.toHaveBeenCalled();
  });

  it("should set isTesting to true then false around the API call", async () => {
    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: "5->2", tools: "tool-a,tool-b" },
    });

    await runSemanticFilterTest(baseArgs);

    expect(mockSetIsTesting).toHaveBeenNthCalledWith(1, true);
    expect(mockSetIsTesting).toHaveBeenNthCalledWith(2, false);
  });

  it("should clear the previous test result before making a new request", async () => {
    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: "5->2", tools: "tool-a,tool-b" },
    });

    await runSemanticFilterTest(baseArgs);

    expect(mockSetTestResult).toHaveBeenNthCalledWith(1, null);
  });

  it("should set test result with parsed data on success", async () => {
    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: "10->3", tools: "wiki,github,slack" },
    });

    await runSemanticFilterTest(baseArgs);

    expect(mockSetTestResult).toHaveBeenCalledWith({
      totalTools: 10,
      selectedTools: 3,
      tools: ["wiki", "github", "slack"],
    });
    expect(toast.success).toHaveBeenCalledWith("Semantic filter test completed successfully");
  });

  it("should show a warning when the filter header is missing", async () => {
    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: null, tools: null },
    });

    await runSemanticFilterTest(baseArgs);

    expect(toast.warning).toHaveBeenCalledWith("Semantic filter is not enabled or no tools were filtered");
    expect(mockSetTestResult).not.toHaveBeenCalledWith(expect.objectContaining({ totalTools: expect.any(Number) }));
  });

  it("should show an error notification and finish testing when the API call fails", async () => {
    vi.mocked(testMCPSemanticFilter).mockRejectedValueOnce(new Error("Network error"));

    await runSemanticFilterTest(baseArgs);

    expect(toast.error).toHaveBeenCalledWith("Failed to test semantic filter");
    expect(mockSetIsTesting).toHaveBeenLastCalledWith(false);
  });

  it("should surface the backend error message via setTestError when the API call fails", async () => {
    const backendMessage =
      "MCP semantic tool filtering could not run: embedding model 'text-embedding-3-small' exceeded its context window while embedding the user query.";
    vi.mocked(testMCPSemanticFilter).mockRejectedValueOnce(new Error(backendMessage));

    await runSemanticFilterTest(baseArgs);

    expect(mockSetTestError).toHaveBeenLastCalledWith(backendMessage);
  });

  it("should clear the previous test error before making a new request", async () => {
    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: "5->2", tools: "tool-a,tool-b" },
    });

    await runSemanticFilterTest(baseArgs);

    expect(mockSetTestError).toHaveBeenCalledTimes(1);
    expect(mockSetTestError).toHaveBeenCalledWith(null);
  });

  it("should fall back to a generic message when the thrown error has no message", async () => {
    vi.mocked(testMCPSemanticFilter).mockRejectedValueOnce(new Error(""));

    await runSemanticFilterTest(baseArgs);

    expect(mockSetTestError).toHaveBeenLastCalledWith("Failed to test semantic filter");
  });
});

describe("runSemanticFilterTest Chinese copy", () => {
  const mockSetIsTesting = vi.fn();
  const mockSetTestResult = vi.fn();
  const mockSetTestError = vi.fn();
  const baseArgs = {
    accessToken: "test-token",
    testModel: "gpt-4o",
    testQuery: "find relevant files",
    setIsTesting: mockSetIsTesting,
    setTestResult: mockSetTestResult,
    setTestError: mockSetTestError,
    t: zh,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should toast the Chinese validation, empty, success and failure copy", async () => {
    await runSemanticFilterTestWithT({ ...baseArgs, testQuery: "" });
    expect(toast.error).toHaveBeenCalledWith("请输入查询并选择模型");
    expect(toast.error).not.toHaveBeenCalledWith("Please enter a query and select a model");

    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({ data: {}, headers: { filter: null, tools: null } });
    await runSemanticFilterTestWithT(baseArgs);
    expect(toast.warning).toHaveBeenCalledWith("语义筛选未启用，或没有工具被筛除");
    expect(toast.warning).not.toHaveBeenCalledWith("Semantic filter is not enabled or no tools were filtered");

    vi.mocked(testMCPSemanticFilter).mockResolvedValueOnce({
      data: {},
      headers: { filter: "10->3", tools: "wiki,github,slack" },
    });
    await runSemanticFilterTestWithT(baseArgs);
    expect(toast.success).toHaveBeenCalledWith("语义筛选测试已成功完成");
    expect(toast.success).not.toHaveBeenCalledWith("Semantic filter test completed successfully");

    vi.mocked(testMCPSemanticFilter).mockRejectedValueOnce(new Error(""));
    await runSemanticFilterTestWithT(baseArgs);
    expect(toast.error).toHaveBeenCalledWith("测试语义筛选失败");
    expect(mockSetTestError).toHaveBeenLastCalledWith("测试语义筛选失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to test semantic filter");
  });
});
