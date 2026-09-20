import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { validateBlockedWordsFile } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import ContentFilterConfiguration from "./ContentFilterConfiguration";

vi.mock("@/components/networking", () => ({
  validateBlockedWordsFile: vi.fn(),
  getCategoryYaml: vi.fn(),
}));

const PREBUILT = [
  { name: "us_ssn", display_name: "US Social Security Number", category: "PII Patterns", description: "d" },
];

describe("ContentFilterConfiguration", () => {
  const handlers = {
    onPatternAdd: vi.fn(),
    onPatternRemove: vi.fn(),
    onPatternActionChange: vi.fn(),
    onBlockedWordAdd: vi.fn(),
    onBlockedWordRemove: vi.fn(),
    onBlockedWordUpdate: vi.fn(),
  };

  const renderConfig = (overrides = {}) =>
    renderWithProviders(
      <ContentFilterConfiguration
        prebuiltPatterns={PREBUILT}
        categories={["PII Patterns"]}
        selectedPatterns={[]}
        blockedWords={[]}
        accessToken="test-token"
        {...handlers}
        {...overrides}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the pattern and keyword sections", () => {
    renderConfig();

    expect(screen.getByText("Pattern Detection")).toBeInTheDocument();
    expect(
      screen.getByText("Detect sensitive information using regex patterns (SSN, credit cards, API keys, etc.)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Blocked Keywords")).toBeInTheDocument();
    expect(screen.getByText("Block or mask specific sensitive terms and phrases")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add prebuilt pattern/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add custom regex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add keyword/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload yaml file/i })).toBeInTheDocument();
  });

  it("should show the empty states for patterns and keywords", () => {
    renderConfig();

    expect(screen.getByText("No patterns added.")).toBeInTheDocument();
    expect(screen.getByText("No keywords added.")).toBeInTheDocument();
  });

  it("should open the prebuilt pattern modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Pattern type")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add prebuilt pattern/i }));

    expect(await screen.findByText("Pattern type")).toBeInTheDocument();
  });

  it("should open the custom regex modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Add custom regex pattern")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add custom regex/i }));

    expect(await screen.findByText("Add custom regex pattern")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., ID-[0-9]{6}")).toBeInTheDocument();
  });

  it("should open the keyword modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Add blocked keyword")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add keyword/i }));

    expect(await screen.findByText("Add blocked keyword")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter sensitive keyword or phrase")).toBeInTheDocument();
  });

  it("should list already selected patterns and keywords", () => {
    renderConfig({
      selectedPatterns: [
        {
          id: "pattern-1",
          type: "prebuilt" as const,
          name: "us_ssn",
          display_name: "US Social Security Number",
          action: "BLOCK" as const,
        },
      ],
      blockedWords: [{ id: "word-1", keyword: "secret", action: "MASK" as const, description: "Sensitive" }],
    });

    expect(screen.getByText("US Social Security Number")).toBeInTheDocument();
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.queryByText("No patterns added.")).not.toBeInTheDocument();
    expect(screen.queryByText("No keywords added.")).not.toBeInTheDocument();
  });

  it("should show only the keyword section when the keywords step is requested", () => {
    renderConfig({ showStep: "keywords" });

    expect(screen.getByText("Blocked Keywords")).toBeInTheDocument();
    expect(screen.queryByText("Pattern Detection")).not.toBeInTheDocument();
  });

  it("should show only the pattern section when the patterns step is requested", () => {
    renderConfig({ showStep: "patterns" });

    expect(screen.getByText("Pattern Detection")).toBeInTheDocument();
    expect(screen.queryByText("Blocked Keywords")).not.toBeInTheDocument();
  });
});

describe("ContentFilterConfiguration Chinese copy", () => {
  const handlers = {
    onPatternAdd: vi.fn(),
    onPatternRemove: vi.fn(),
    onPatternActionChange: vi.fn(),
    onBlockedWordAdd: vi.fn(),
    onBlockedWordRemove: vi.fn(),
    onBlockedWordUpdate: vi.fn(),
  };

  const renderZhConfig = (overrides = {}) =>
    renderWithProviders(
      <ContentFilterConfiguration
        prebuiltPatterns={PREBUILT}
        categories={["PII Patterns"]}
        selectedPatterns={[]}
        blockedWords={[]}
        accessToken="test-token"
        {...handlers}
        {...overrides}
      />,
    );

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese configuration chrome and hides the English one", () => {
    renderZhConfig();

    expect(screen.getByText(/配置匹配模式、关键词和内容类别/)).toBeInTheDocument();
    expect(screen.getByText("匹配模式检测")).toBeInTheDocument();
    expect(screen.getByText(/使用正则表达式检测敏感信息/)).toBeInTheDocument();
    expect(screen.getByText("屏蔽关键词")).toBeInTheDocument();
    expect(screen.getByText("阻止或屏蔽特定的敏感词和短语")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加预置匹配模式" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加自定义正则" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加关键词" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传 YAML 文件" })).toBeInTheDocument();

    expect(screen.queryByText("Pattern Detection")).not.toBeInTheDocument();
    expect(screen.queryByText("Blocked Keywords")).not.toBeInTheDocument();
    expect(screen.queryByText("Block or mask specific sensitive terms and phrases")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Configure patterns, keywords, and content categories to detect and filter sensitive information in requests and responses.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Detect sensitive information using regex patterns (SSN, credit cards, API keys, etc.)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add prebuilt pattern/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add custom regex/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add keyword/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upload YAML file/i })).not.toBeInTheDocument();
  });

  it("renders the Chinese modal validation toasts and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhConfig();

    await user.click(screen.getByRole("button", { name: "添加预置匹配模式" }));
    await user.click(await screen.findByRole("button", { name: "添加" }));
    expect(toast.error).toHaveBeenCalledWith("请选择一个匹配模式");
    expect(toast.error).not.toHaveBeenCalledWith("Please select a pattern");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await user.click(screen.getByRole("button", { name: "添加自定义正则" }));
    await user.click(await screen.findByRole("button", { name: "添加" }));
    expect(toast.error).toHaveBeenCalledWith("请提供匹配模式名称和正则表达式");
    expect(toast.error).not.toHaveBeenCalledWith("Please provide pattern name and regex");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await user.click(screen.getByRole("button", { name: "添加关键词" }));
    await user.click(await screen.findByRole("button", { name: "添加" }));
    expect(toast.error).toHaveBeenCalledWith("请输入关键词");
    expect(toast.error).not.toHaveBeenCalledWith("Please enter a keyword");
  });

  /* eslint-disable testing-library/no-container, testing-library/no-node-access -- jsdom cannot open a native file picker, so the hidden file input is reached directly to fire its change event */
  it("renders the Chinese upload success and failure toasts and hides the English ones", async () => {
    const mockValidate = vi.mocked(validateBlockedWordsFile);
    const { container } = renderZhConfig();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const upload = async () => {
      const file = new File(["words"], "words.yaml", { type: "text/yaml" });
      Object.defineProperty(file, "text", { value: () => Promise.resolve("words") });
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      fireEvent.change(input);
    };

    mockValidate.mockResolvedValue({ valid: true, message: "" });
    await upload();
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("文件上传成功"));
    expect(toast.success).not.toHaveBeenCalledWith("File uploaded successfully");

    mockValidate.mockResolvedValue({ valid: false });
    await upload();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("校验失败：文件无效"));
    expect(toast.error).not.toHaveBeenCalledWith("Validation failed: Invalid file");

    mockValidate.mockResolvedValue({ valid: false, error: "bad words" });
    await upload();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("校验失败：bad words"));

    mockValidate.mockRejectedValue(new Error("boom"));
    await upload();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("上传文件失败：Error: boom"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to upload file: Error: boom");
  });
});
