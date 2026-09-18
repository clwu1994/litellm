import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "../../../../tests/test-utils";
import { CommunityEngagementButtons } from "./CommunityEngagementButtons";

let mockUseDisableShowPromptsImpl = () => false;

vi.mock("@/app/(dashboard)/hooks/useDisableShowPrompts", () => ({
  useDisableShowPrompts: () => mockUseDisableShowPromptsImpl(),
}));

describe("CommunityEngagementButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDisableShowPromptsImpl = () => false;
  });

  it("should render", () => {
    renderWithProviders(<CommunityEngagementButtons />);
    expect(screen.getByRole("link", { name: /join slack/i })).toBeInTheDocument();
  });

  it("should render Join Slack button with correct link", () => {
    renderWithProviders(<CommunityEngagementButtons />);

    const joinSlackLink = screen.getByRole("link", { name: /join slack/i });
    expect(joinSlackLink).toBeInTheDocument();
    expect(joinSlackLink).toHaveAttribute("href", "https://www.litellm.ai/support");
    expect(joinSlackLink).toHaveAttribute("target", "_blank");
    expect(joinSlackLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render GitHub link with correct href", () => {
    renderWithProviders(<CommunityEngagementButtons />);

    const githubLink = screen.getByRole("link", { name: /litellm on github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", "https://github.com/BerriAI/litellm");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should not render buttons when prompts are disabled", () => {
    mockUseDisableShowPromptsImpl = () => true;

    renderWithProviders(<CommunityEngagementButtons />);

    expect(screen.queryByRole("link", { name: /join slack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /litellm on github/i })).not.toBeInTheDocument();
  });
});

describe("CommunityEngagementButtons localization", () => {
  beforeEach(() => {
    mockUseDisableShowPromptsImpl = () => false;
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the community links and their group label in Chinese under zh", async () => {
    await i18n.changeLanguage("zh");
    renderWithProviders(<CommunityEngagementButtons />);

    expect(screen.getByRole("group", { name: "社区链接" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "加入 Slack" })).toHaveAttribute("href", "https://www.litellm.ai/support");
    expect(screen.getByRole("link", { name: "GitHub 上的 LiteLLM" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm",
    );

    expect(screen.queryByRole("link", { name: /join slack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Community links" })).not.toBeInTheDocument();
  });

  it("renders the community links and their group label in English under en", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<CommunityEngagementButtons />);

    expect(screen.getByRole("group", { name: "Community links" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join slack/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /litellm on github/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "加入 Slack" })).not.toBeInTheDocument();
  });
});
