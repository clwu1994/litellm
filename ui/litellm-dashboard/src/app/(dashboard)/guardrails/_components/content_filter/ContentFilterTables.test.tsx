import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCategoryYaml } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import CategoryTable from "./CategoryTable";
import ContentCategoryConfiguration from "./ContentCategoryConfiguration";
import KeywordTable from "./KeywordTable";
import PatternTable from "./PatternTable";

vi.mock("@/components/networking", () => ({ getCategoryYaml: vi.fn() }));

const mockGetCategoryYaml = vi.mocked(getCategoryYaml);

describe("content filter tables", () => {
  it("should render category details in the shared table and remove a category", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryTable
        categories={[
          {
            id: "category-1",
            category: "self_harm",
            display_name: "Self Harm",
            action: "BLOCK",
            severity_threshold: "high",
          },
        ]}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Severity Threshold" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByText("Self Harm")).toBeInTheDocument();
    expect(screen.getByText("self_harm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onRemove).toHaveBeenCalledWith("category-1");
  });

  it("should render keyword details in the shared table and remove a keyword", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <KeywordTable
        keywords={[{ id: "keyword-1", keyword: "secret", action: "MASK", description: "Sensitive term" }]}
        onActionChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Keyword" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Description" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.getByText("Sensitive term")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onRemove).toHaveBeenCalledWith("keyword-1");
  });

  it("should render pattern details in the shared table and remove a pattern", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PatternTable
        patterns={[
          {
            id: "pattern-1",
            type: "custom",
            name: "email",
            display_name: "Email address",
            pattern: "[a-z]+@example\\.com",
            action: "BLOCK",
          },
        ]}
        onActionChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Pattern name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Regex pattern" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getByText(/\[a-z\]\+@example/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onRemove).toHaveBeenCalledWith("pattern-1");
  });

  it("should render selected topic details in the shared table and remove a blocked topic", async () => {
    const onCategoryRemove = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ContentCategoryConfiguration
        availableCategories={[
          {
            name: "violence",
            display_name: "Violence",
            description: "Violent content",
            default_action: "BLOCK",
          },
        ]}
        selectedCategories={[
          {
            id: "category-1",
            category: "violence",
            display_name: "Violence",
            action: "BLOCK",
            severity_threshold: "medium",
          },
        ]}
        onCategoryAdd={vi.fn()}
        onCategoryRemove={onCategoryRemove}
        onCategoryUpdate={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Severity Threshold" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByText("Violent content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(onCategoryRemove).toHaveBeenCalledWith("category-1");
  });

  it("should report a pattern action change", async () => {
    const onActionChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PatternTable
        patterns={[{ id: "pattern-1", type: "prebuilt", name: "email", action: "BLOCK" }]}
        onActionChange={onActionChange}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    const maskOptions = await screen.findAllByText("Mask");
    await user.click(maskOptions[maskOptions.length - 1]);

    expect(onActionChange).toHaveBeenCalledWith("pattern-1", "MASK");
  });

  it("should report a keyword action change", async () => {
    const onActionChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <KeywordTable
        keywords={[{ id: "keyword-1", keyword: "secret", action: "BLOCK" }]}
        onActionChange={onActionChange}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    const maskOptions = await screen.findAllByText("Mask");
    await user.click(maskOptions[maskOptions.length - 1]);

    expect(onActionChange).toHaveBeenCalledWith("keyword-1", "action", "MASK");
  });

  it("should report category severity and action changes", async () => {
    const onSeverityChange = vi.fn();
    const onActionChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryTable
        categories={[
          {
            id: "category-1",
            category: "self_harm",
            display_name: "Self Harm",
            action: "BLOCK",
            severity_threshold: "high",
          },
        ]}
        onActionChange={onActionChange}
        onSeverityChange={onSeverityChange}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("combobox")[0]);
    const lowOptions = await screen.findAllByText("Low");
    await user.click(lowOptions[lowOptions.length - 1]);

    expect(onSeverityChange).toHaveBeenCalledWith("category-1", "low");

    await user.click(screen.getAllByRole("combobox")[1]);
    const maskOptions = await screen.findAllByText("Mask");
    await user.click(maskOptions[maskOptions.length - 1]);

    expect(onActionChange).toHaveBeenCalledWith("category-1", "MASK");
  });

  it("should keep the read-only severity and action badges on the raw wire values", () => {
    renderWithProviders(
      <CategoryTable
        categories={[
          {
            id: "category-1",
            category: "self_harm",
            display_name: "Self Harm",
            action: "BLOCK",
            severity_threshold: "high",
          },
        ]}
        readOnly
      />,
    );

    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("BLOCK")).toBeInTheDocument();
    expect(screen.queryByText("High")).not.toBeInTheDocument();
    expect(screen.queryByText("Block")).not.toBeInTheDocument();
  });

  it("should keep the blocked-topic action option badges on the raw wire values", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ContentCategoryConfiguration
        availableCategories={[
          {
            name: "violence",
            display_name: "Violence",
            description: "Violent content",
            default_action: "BLOCK",
          },
        ]}
        selectedCategories={[
          {
            id: "category-1",
            category: "violence",
            display_name: "Violence",
            action: "BLOCK",
            severity_threshold: "medium",
          },
        ]}
        onCategoryAdd={vi.fn()}
        onCategoryRemove={vi.fn()}
        onCategoryUpdate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Action" }));

    expect(await screen.findByRole("option", { name: "BLOCK" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MASK" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Block" })).not.toBeInTheDocument();
  });
});

const ZH_CATEGORIES = [
  { name: "violence", display_name: "Violence", description: "Violent content", default_action: "BLOCK" },
  { name: "hate", display_name: "Hate", description: "Hateful content", default_action: "MASK" },
];

const ZH_SELECTED = [
  {
    id: "category-1",
    category: "violence",
    display_name: "Violence",
    action: "BLOCK" as const,
    severity_threshold: "medium" as const,
  },
];

const renderCategoryConfig = (accessToken?: string) =>
  renderWithProviders(
    <ContentCategoryConfiguration
      availableCategories={ZH_CATEGORIES}
      selectedCategories={ZH_SELECTED}
      onCategoryAdd={vi.fn()}
      onCategoryRemove={vi.fn()}
      onCategoryUpdate={vi.fn()}
      accessToken={accessToken}
    />,
  );

describe("content filter tables Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese category table chrome and hides the English one", () => {
    renderWithProviders(
      <CategoryTable
        categories={[ZH_SELECTED[0]]}
        onActionChange={vi.fn()}
        onSeverityChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "类别" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "严重程度阈值" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "严重程度阈值" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();

    expect(screen.queryByText("Severity Threshold")).not.toBeInTheDocument();
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders the Chinese severity options and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <CategoryTable
        categories={[ZH_SELECTED[0]]}
        onActionChange={vi.fn()}
        onSeverityChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "严重程度阈值" }));

    expect(await screen.findByRole("option", { name: "高" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "中" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "低" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "High" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Medium" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Low" })).not.toBeInTheDocument();
  });

  it("renders the Chinese category table empty state", () => {
    renderWithProviders(
      <CategoryTable categories={[]} onActionChange={vi.fn()} onSeverityChange={vi.fn()} onRemove={vi.fn()} />,
    );

    expect(screen.getByText("尚未配置类别。")).toBeInTheDocument();
    expect(screen.queryByText("No categories configured.")).not.toBeInTheDocument();
  });

  it("renders the Chinese read-only severity and action labels", () => {
    renderWithProviders(<CategoryTable categories={[ZH_SELECTED[0]]} readOnly />);

    expect(screen.getByText("中")).toBeInTheDocument();
    expect(screen.getByText("阻止")).toBeInTheDocument();
    expect(screen.queryByText("MEDIUM")).not.toBeInTheDocument();
    expect(screen.queryByText("BLOCK")).not.toBeInTheDocument();
  });

  it("renders the Chinese blocked-topic action option badges", async () => {
    const user = userEvent.setup({ delay: null });
    renderCategoryConfig();

    await user.click(screen.getByRole("combobox", { name: "操作" }));

    expect(await screen.findByRole("option", { name: "阻止" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "屏蔽" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "BLOCK" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Block" })).not.toBeInTheDocument();
  });

  it("renders the Chinese keyword table chrome and empty state", () => {
    const { unmount } = renderWithProviders(
      <KeywordTable
        keywords={[{ id: "keyword-1", keyword: "secret", action: "MASK", description: "Sensitive term" }]}
        onActionChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "关键词" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "描述" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByText("Keyword")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();

    unmount();
    renderWithProviders(<KeywordTable keywords={[]} onActionChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("尚未添加关键词。")).toBeInTheDocument();
    expect(screen.queryByText("No keywords added.")).not.toBeInTheDocument();
  });

  it("renders the Chinese pattern table chrome, type badges and empty state", () => {
    const { unmount } = renderWithProviders(
      <PatternTable
        patterns={[{ id: "pattern-1", type: "prebuilt", name: "email", action: "BLOCK" }]}
        onActionChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "类型" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "匹配模式名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "正则表达式" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByText("预置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByText("Prebuilt")).not.toBeInTheDocument();
    expect(screen.queryByText("Pattern name")).not.toBeInTheDocument();
    expect(screen.queryByText("Regex pattern")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();

    unmount();
    renderWithProviders(
      <PatternTable
        patterns={[{ id: "pattern-2", type: "custom", name: "email", action: "BLOCK" }]}
        onActionChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("自定义")).toBeInTheDocument();
    expect(screen.queryByText("Custom")).not.toBeInTheDocument();

    unmount();
    renderWithProviders(<PatternTable patterns={[]} onActionChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("尚未添加匹配模式。")).toBeInTheDocument();
    expect(screen.queryByText("No patterns added.")).not.toBeInTheDocument();
  });

  it("renders the Chinese blocked-topics chrome and the no-match empty state", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ContentCategoryConfiguration
        availableCategories={ZH_CATEGORIES}
        selectedCategories={[]}
        onCategoryAdd={vi.fn()}
        onCategoryRemove={vi.fn()}
        onCategoryUpdate={vi.fn()}
      />,
    );

    expect(screen.getByText("屏蔽主题")).toBeInTheDocument();
    expect(screen.getByText("使用关键词和语义分析选择要屏蔽的主题")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择内容类别")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.getByText("尚未选择屏蔽主题。添加主题以检测并屏蔽有害内容。")).toBeInTheDocument();
    expect(screen.queryByText("Blocked topics")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a content category")).not.toBeInTheDocument();
    expect(screen.queryByText("Select topics to block using keyword and semantic analysis")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No blocked topics selected. Add topics to detect and block harmful content."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择内容类别"));
    await user.type(screen.getByPlaceholderText("选择内容类别"), "zzz");
    expect(await screen.findByText("没有匹配的类别")).toBeInTheDocument();
    expect(screen.queryByText("No matching categories")).not.toBeInTheDocument();
  });

  it("renders the Chinese selected-category chrome, preview and unavailable file content", async () => {
    const user = userEvent.setup();
    renderCategoryConfig();

    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(screen.getByText("查看 Violence 的 YAML")).toBeInTheDocument();
    expect(screen.queryByText(/View YAML for Violence/)).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择内容类别"));
    await user.click(await screen.findByText("Hate"));

    expect(await screen.findByText("预览：Hate")).toBeInTheDocument();
    expect(screen.getByText("无法加载类别内容")).toBeInTheDocument();
    expect(screen.queryByText(/Preview: Hate/)).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to load category content")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading and collapsed-content states", async () => {
    const user = userEvent.setup();
    mockGetCategoryYaml.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderCategoryConfig("test-token");

    await user.click(screen.getByRole("button", { name: /查看 Violence 的 YAML/ }));
    expect(await screen.findByText("正在加载内容...")).toBeInTheDocument();
    expect(screen.queryByText("Loading content...")).not.toBeInTheDocument();

    unmount();
    mockGetCategoryYaml.mockRejectedValue(new Error("nope"));
    renderCategoryConfig("test-token");

    await user.click(screen.getByRole("button", { name: /查看 Violence 的 YAML/ }));
    expect(await screen.findByText("展开后将加载内容")).toBeInTheDocument();
    expect(screen.queryByText("Content will load when expanded")).not.toBeInTheDocument();
  });
});
