import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPromptVersions, PromptSpec } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VersionHistorySidePanel from "./VersionHistorySidePanel";

vi.mock("@/components/networking", () => ({ getPromptVersions: vi.fn() }));

const versions = [
  {
    prompt_id: "welcome.v2",
    version: 2,
    created_at: "2024-01-15T10:30:00Z",
    litellm_params: {},
    prompt_info: { prompt_type: "db" },
  },
  {
    prompt_id: "welcome.v1",
    version: 1,
    created_at: "2024-01-10T09:00:00Z",
    litellm_params: {},
    prompt_info: { prompt_type: "config" },
  },
] satisfies PromptSpec[];

const props = {
  isOpen: true,
  onClose: vi.fn(),
  accessToken: "token",
  promptId: "welcome.v2",
  activeVersionId: "welcome.v2",
  onSelectVersion: vi.fn(),
};

describe("VersionHistorySidePanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: versions });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese panel title and close label, hiding the English originals", async () => {
    renderWithProviders(<VersionHistorySidePanel {...props} />);

    expect(await screen.findByRole("dialog", { name: "版本历史" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Version History" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the Chinese loading label, hiding the English original", () => {
    vi.mocked(getPromptVersions).mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<VersionHistorySidePanel {...props} />);

    expect(screen.getByRole("status", { name: "正在加载版本历史" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading version history" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state, hiding the English original", async () => {
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [] });
    renderWithProviders(<VersionHistorySidePanel {...props} />);

    expect(await screen.findByText("暂无版本历史。")).toBeInTheDocument();
    expect(screen.queryByText("No version history available.")).not.toBeInTheDocument();
  });

  it("renders the Chinese version badges and prompt sources, hiding the English originals", async () => {
    renderWithProviders(<VersionHistorySidePanel {...props} />);

    expect(await screen.findByText("最新")).toBeInTheDocument();
    expect(screen.queryByText("Latest")).not.toBeInTheDocument();
    expect(screen.getByText("当前")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.getByText("已保存到数据库")).toBeInTheDocument();
    expect(screen.queryByText("Saved to Database")).not.toBeInTheDocument();
    expect(screen.getByText("配置提示词")).toBeInTheDocument();
    expect(screen.queryByText("Config Prompt")).not.toBeInTheDocument();
  });
});
