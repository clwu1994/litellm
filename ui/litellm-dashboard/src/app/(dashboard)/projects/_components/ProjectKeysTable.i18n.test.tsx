import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ProjectKeysTable } from "./ProjectKeysTable";
import { KeyResponse } from "@/components/key_team_helpers/key_list";

vi.mock("@/components/common_components/DefaultProxyAdminTag", () => ({
  default: ({ userId }: { userId: string }) => <span data-testid="owner-tag">{userId}</span>,
}));

vi.mock("next/navigation", async () => ({
  ...(await vi.importActual("next/navigation")),
  useRouter: () => ({ push: vi.fn() }),
}));

const makeKey = (overrides: Partial<KeyResponse> = {}): KeyResponse =>
  ({
    token: "tok-1",
    key_alias: "Test Key",
    user_id: "owner-1",
    created_at: "2024-03-01T00:00:00Z",
    last_active: null,
    ...overrides,
  }) as KeyResponse;

const defaultProps = {
  totalCount: 0,
  isLoading: false,
  pagination: { pageIndex: 0, pageSize: 5 },
  onPaginationChange: vi.fn(),
};

describe("ProjectKeysTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[makeKey()]} totalCount={1} />);

    expect(screen.getByText("密钥名称")).toBeInTheDocument();
    expect(screen.queryByText("Key Name")).not.toBeInTheDocument();
    expect(screen.getByText("所有者")).toBeInTheDocument();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    expect(screen.getByText("最近活跃")).toBeInTheDocument();
    expect(screen.queryByText("Last Active")).not.toBeInTheDocument();
  });

  it("renders the Chinese never fallback in the Last Active column", () => {
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[makeKey({ last_active: null })]} totalCount={1} />);

    expect(screen.getByText("从未")).toBeInTheDocument();
    expect(screen.queryByText("Never")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the keys are loading", () => {
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[]} isLoading />);

    expect(screen.getByText("正在加载密钥…")).toBeInTheDocument();
    expect(screen.queryByText("Loading keys…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state with the English original absent", () => {
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[]} />);

    expect(screen.getByText("未找到密钥")).toBeInTheDocument();
    expect(screen.queryByText("No keys found")).not.toBeInTheDocument();
    expect(screen.getByText("在此项目中创建的密钥将显示在这里。")).toBeInTheDocument();
    expect(screen.queryByText("Keys created in this project will show up here.")).not.toBeInTheDocument();
  });
});
