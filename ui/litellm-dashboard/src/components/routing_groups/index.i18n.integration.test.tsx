import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { useRoutingGroups, useSaveRoutingGroups } from "@/app/(dashboard)/hooks/routingGroups/useRoutingGroups";
import { toast } from "@/lib/toast";

import RoutingGroups from "./index";
import type { RoutingGroup } from "./types";

vi.mock("@/app/(dashboard)/hooks/routingGroups/useRoutingGroups", () => ({
  useRoutingGroups: vi.fn(),
  useSaveRoutingGroups: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/router/useRouterFields", () => ({
  useRouterFields: () => ({ data: undefined }),
}));

vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useModelHub: () => ({ data: { data: [{ model_group: "gpt-4o" }] } }),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/proxySettings/useProxySettings", () => ({
  __esModule: true,
  default: () => ({ PROXY_BASE_URL: "https://proxy.example.com" }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), fromError: vi.fn() },
}));

const prodGroup: RoutingGroup = {
  group_name: "prod-group",
  models: ["gpt-4o"],
  routing_strategy: "usage-based-routing",
};

const devGroup: RoutingGroup = {
  group_name: "dev-group",
  models: ["gpt-4o-mini"],
  routing_strategy: "simple-shuffle",
};

const setup = (overrides: { mutateAsync?: ReturnType<typeof vi.fn> } = {}) => {
  const mutateAsync = overrides.mutateAsync ?? vi.fn().mockResolvedValue(undefined);
  vi.mocked(useRoutingGroups).mockReturnValue({
    data: { routingGroups: [prodGroup, devGroup], availableStrategies: ["simple-shuffle"] },
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useRoutingGroups>);
  vi.mocked(useSaveRoutingGroups).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveRoutingGroups>);
  return { mutateAsync };
};

const openDeleteConfirm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("routing-group-actions-prod-group"));
  await user.click(await screen.findByTestId("routing-group-action-delete"));
  return screen.getByRole("dialog");
};

describe("RoutingGroups page Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the page chrome in Chinese", () => {
    setup();
    renderWithProviders(<RoutingGroups />);

    expect(screen.getByPlaceholderText("搜索分组...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search groups...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建分组" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Group" })).not.toBeInTheDocument();
    expect(screen.getByText("显示 2 个结果")).toBeInTheDocument();
    expect(screen.queryByText("Showing 2 results")).not.toBeInTheDocument();
  });

  it("renders the clear-search control and the single-result count in Chinese", async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    await user.type(screen.getByPlaceholderText("搜索分组..."), "prod");

    expect(screen.getByRole("button", { name: "清除搜索" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    expect(screen.getByText("显示 1 个结果")).toBeInTheDocument();
    expect(screen.queryByText("Showing 1 result")).not.toBeInTheDocument();
  });

  it("keeps the singular and plural result counts distinct in English", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    expect(screen.getByText("Showing 2 results")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search groups..."), "prod");

    expect(screen.getByText("Showing 1 result")).toBeInTheDocument();
    expect(screen.queryByText("Showing 1 results")).not.toBeInTheDocument();
  });

  it("renders the delete confirmation and its accessible name in Chinese", async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    expect(screen.getByTestId("routing-group-actions-prod-group")).toHaveAccessibleName("打开 prod-group 的操作");

    const dialog = await openDeleteConfirm(user);

    expect(within(dialog).getByText("删除路由分组？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete routing group?")).not.toBeInTheDocument();
    const body = within(dialog).getByText(/中的模型将回退到代理的顶层路由策略/);
    expect(body).toHaveTextContent("「prod-group」中的模型将回退到代理的顶层路由策略。此操作无法撤销。");
    expect(body).not.toHaveTextContent("will fall back to the proxy's top-level routing strategy");
    expect(within(dialog).queryByText(/This cannot be undone/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("reports a deleted group in Chinese", async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith('已删除路由分组 "prod-group"');
    expect(toast.success).not.toHaveBeenCalledWith('Deleted routing group "prod-group"');
  });

  it("uses the Chinese delete-failure fallback when the save rejects with a non-Error", async () => {
    const user = userEvent.setup();
    setup({ mutateAsync: vi.fn().mockRejectedValue("bad") });
    renderWithProviders(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    expect(toast.error).toHaveBeenCalledWith("删除路由分组失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete routing group");
  });

  it("reports a created group in Chinese", async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    await user.click(screen.getByRole("button", { name: "创建分组" }));
    await user.type(await screen.findByLabelText("分组名称"), "new-group");
    await user.click(screen.getByLabelText("模型"));
    await user.click((await screen.findAllByRole("option"))[0]);
    await user.keyboard("{Escape}");
    await user.click(await screen.findByRole("button", { name: "创建分组" }));
    await user.click(screen.getByRole("button", { name: "创建分组" }));

    expect(toast.success).toHaveBeenCalledWith('已创建路由分组 "new-group"');
    expect(toast.success).not.toHaveBeenCalledWith('Created routing group "new-group"');
  });

  it("reports an updated group in Chinese", async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<RoutingGroups />);

    await user.click(screen.getByTestId("routing-group-actions-prod-group"));
    await user.click(await screen.findByTestId("routing-group-action-edit"));
    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    expect(toast.success).toHaveBeenCalledWith('已更新路由分组 "prod-group"');
    expect(toast.success).not.toHaveBeenCalledWith('Updated routing group "prod-group"');
  });

  it("uses the Chinese create-failure fallback when the save rejects with a non-Error", async () => {
    const user = userEvent.setup();
    setup({ mutateAsync: vi.fn().mockRejectedValue("bad") });
    renderWithProviders(<RoutingGroups />);

    await user.click(screen.getByRole("button", { name: "创建分组" }));
    await user.type(await screen.findByLabelText("分组名称"), "new-group");
    await user.click(screen.getByLabelText("模型"));
    await user.click((await screen.findAllByRole("option"))[0]);
    await user.keyboard("{Escape}");
    await user.click(await screen.findByRole("button", { name: "创建分组" }));

    expect(toast.error).toHaveBeenCalledWith("保存路由分组失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to save routing group");
  });
});
