import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import ContentFilterDisplay from "./ContentFilterDisplay";

const PATTERN = {
  id: "pattern-1",
  type: "prebuilt" as const,
  name: "email",
  display_name: "Email address",
  action: "BLOCK" as const,
};

const KEYWORD = {
  id: "word-1",
  keyword: "secret",
  action: "MASK" as const,
  description: "Sensitive term",
};

const CATEGORY = {
  id: "category-1",
  category: "self_harm",
  display_name: "Self Harm",
  action: "BLOCK" as const,
  severity_threshold: "high" as const,
};

describe("ContentFilterDisplay", () => {
  it("should render nothing when there is no content filter data", () => {
    const { container } = renderWithProviders(<ContentFilterDisplay patterns={[]} blockedWords={[]} categories={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render the categories section with a configured count", () => {
    renderWithProviders(<ContentFilterDisplay patterns={[]} blockedWords={[]} categories={[CATEGORY]} />);

    expect(screen.getByText("Content Categories")).toBeInTheDocument();
    expect(screen.getByText("1 categories configured")).toBeInTheDocument();
    expect(screen.getByText("Self Harm")).toBeInTheDocument();
    expect(screen.queryByText("Pattern Detection")).not.toBeInTheDocument();
    expect(screen.queryByText("Blocked Keywords")).not.toBeInTheDocument();
  });

  it("should render the patterns section with a configured count", () => {
    renderWithProviders(<ContentFilterDisplay patterns={[PATTERN]} blockedWords={[]} categories={[]} />);

    expect(screen.getByText("Pattern Detection")).toBeInTheDocument();
    expect(screen.getByText("1 patterns configured")).toBeInTheDocument();
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.queryByText("Content Categories")).not.toBeInTheDocument();
  });

  it("should render the keywords section with a configured count", () => {
    renderWithProviders(<ContentFilterDisplay patterns={[]} blockedWords={[KEYWORD]} categories={[]} />);

    expect(screen.getByText("Blocked Keywords")).toBeInTheDocument();
    expect(screen.getByText("1 keywords configured")).toBeInTheDocument();
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.getByText("Sensitive term")).toBeInTheDocument();
  });

  it("should render every section when all three kinds of data are present", () => {
    renderWithProviders(<ContentFilterDisplay patterns={[PATTERN]} blockedWords={[KEYWORD]} categories={[CATEGORY]} />);

    expect(screen.getByText("Content Categories")).toBeInTheDocument();
    expect(screen.getByText("Pattern Detection")).toBeInTheDocument();
    expect(screen.getByText("Blocked Keywords")).toBeInTheDocument();
  });

  it("should render category severity and action as static text in read-only mode", () => {
    renderWithProviders(
      <ContentFilterDisplay patterns={[PATTERN]} blockedWords={[KEYWORD]} categories={[CATEGORY]} readOnly={true} />,
    );

    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("BLOCK")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  it("should render category severity and action as editable controls when not read-only", () => {
    renderWithProviders(
      <ContentFilterDisplay patterns={[PATTERN]} blockedWords={[KEYWORD]} categories={[CATEGORY]} readOnly={false} />,
    );

    expect(screen.queryByText("HIGH")).not.toBeInTheDocument();
    expect(screen.queryByText("BLOCK")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(3);
  });
});

describe("ContentFilterDisplay Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese section headings and configured counts and hides the English ones", () => {
    renderWithProviders(<ContentFilterDisplay patterns={[PATTERN]} blockedWords={[KEYWORD]} categories={[CATEGORY]} />);

    expect(screen.getByText("内容类别")).toBeInTheDocument();
    expect(screen.getByText("已配置 1 个类别")).toBeInTheDocument();
    expect(screen.getByText("匹配模式检测")).toBeInTheDocument();
    expect(screen.getByText("已配置 1 个匹配模式")).toBeInTheDocument();
    expect(screen.getByText("屏蔽关键词")).toBeInTheDocument();
    expect(screen.getByText("已配置 1 个关键词")).toBeInTheDocument();

    expect(screen.queryByText("Content Categories")).not.toBeInTheDocument();
    expect(screen.queryByText("1 categories configured")).not.toBeInTheDocument();
    expect(screen.queryByText("1 patterns configured")).not.toBeInTheDocument();
    expect(screen.queryByText("1 keywords configured")).not.toBeInTheDocument();
  });

  it("renders the Chinese read-only severity and action labels instead of the raw wire values", () => {
    renderWithProviders(
      <ContentFilterDisplay patterns={[PATTERN]} blockedWords={[KEYWORD]} categories={[CATEGORY]} readOnly />,
    );

    expect(screen.getByText("高")).toBeInTheDocument();
    expect(screen.getAllByText("阻止").length).toBeGreaterThan(0);
    expect(screen.queryByText("HIGH")).not.toBeInTheDocument();
    expect(screen.queryByText("BLOCK")).not.toBeInTheDocument();
    expect(screen.queryByText("High")).not.toBeInTheDocument();
    expect(screen.queryByText("Block")).not.toBeInTheDocument();
  });
});
