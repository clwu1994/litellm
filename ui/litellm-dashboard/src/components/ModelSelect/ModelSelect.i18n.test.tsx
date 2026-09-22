import type { ProxyModel } from "@/app/(dashboard)/hooks/models/useModels";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAllProxyModels } from "@/app/(dashboard)/hooks/models/useModels";
import { useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useTeam } from "@/app/(dashboard)/hooks/teams/useTeams";
import { useCurrentUser } from "@/app/(dashboard)/hooks/users/useCurrentUser";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ModelSelect } from "./ModelSelect";

vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({ useAllProxyModels: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({ useTeam: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({ useOrganization: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/users/useCurrentUser", () => ({ useCurrentUser: vi.fn() }));

const mockUseAllProxyModels = vi.mocked(useAllProxyModels);
const mockUseTeam = vi.mocked(useTeam);
const mockUseOrganization = vi.mocked(useOrganization);
const mockUseCurrentUser = vi.mocked(useCurrentUser);

const MODEL = (id: string, ownedBy: string): ProxyModel => ({ id, object: "model", created: 1, owned_by: ownedBy });

const mockProxyModels: ProxyModel[] = [
  MODEL("gpt-4", "openai"),
  MODEL("claude-3", "anthropic"),
  MODEL("gemini-2.5-pro", "google"),
  MODEL("llama-3", "meta"),
  MODEL("mistral-large", "mistral"),
  MODEL("deepseek-chat", "deepseek"),
  MODEL("openai/*", "openai"),
];

const openModelList = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getAllByRole("combobox")[0]);
  await screen.findByRole("listbox");
};

describe("ModelSelect Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseAllProxyModels.mockReturnValue({ data: { data: mockProxyModels }, isLoading: false } as never);
    mockUseTeam.mockReturnValue({ data: undefined, isLoading: false } as never);
    mockUseOrganization.mockReturnValue({ data: undefined, isLoading: false } as never);
    mockUseCurrentUser.mockReturnValue({ data: { models: [] }, isLoading: false } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese group headings and special options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ModelSelect
        onChange={vi.fn()}
        context="user"
        options={{ showAllProxyModelsOverride: true, includeSpecialOptions: true }}
      />,
    );

    await openModelList(user);

    expect(screen.getByText("特殊选项")).toBeInTheDocument();
    expect(screen.getByText("所有 Proxy 模型")).toBeInTheDocument();
    expect(screen.getByText("无默认模型")).toBeInTheDocument();
    expect(screen.getByText("通配符选项")).toBeInTheDocument();
    expect(screen.getByText("所有 Openai 模型")).toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Special Options")).not.toBeInTheDocument();
    expect(screen.queryByText("All Proxy Models")).not.toBeInTheDocument();
    expect(screen.queryByText("No Default Models")).not.toBeInTheDocument();
    expect(screen.queryByText("Wildcard Options")).not.toBeInTheDocument();
    expect(screen.queryByText("All Openai models")).not.toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese select-models placeholder and hides the English original", () => {
    renderWithProviders(<ModelSelect onChange={vi.fn()} context="user" />);

    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-models empty text and hides the English original", async () => {
    const user = userEvent.setup();
    mockUseAllProxyModels.mockReturnValue({ data: { data: [] }, isLoading: false } as never);
    renderWithProviders(<ModelSelect onChange={vi.fn()} context="user" />);

    await openModelList(user);

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the Chinese overflow count and hides the English original", () => {
    renderWithProviders(
      <ModelSelect
        onChange={vi.fn()}
        value={["gpt-4", "claude-3", "gemini-2.5-pro", "llama-3", "mistral-large", "deepseek-chat"]}
        context="user"
      />,
    );

    expect(screen.getByText("还有 1 个")).toBeInTheDocument();
    expect(screen.queryByText("+1 more")).not.toBeInTheDocument();
  });
});
