import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { ApiError } from "@/lib/http/client";
import { toast } from "@/lib/toast";

import BudgetPanel from "./budget_panel";

const { getMock, budgetDeleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  budgetDeleteMock: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  apiClient: { get: getMock },
  budgetCreateCall: vi.fn(),
  budgetUpdateCall: vi.fn(),
  budgetDeleteCall: budgetDeleteMock,
  getProxyBaseUrl: () => "",
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ accessToken: "sk-test", userRole: "Admin", userId: "u1" }),
}));

interface BudgetSeed {
  budget_id: string;
  max_budget: number | null;
  budget_duration: string | null;
}

const budgetRow = (seed: BudgetSeed) => ({
  soft_budget: null,
  tpm_limit: 1000,
  rpm_limit: 10,
  budget_reset_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...seed,
});

const FORBIDDEN_PROBLEM = {
  type: "about:blank",
  title: "Forbidden",
  status: 403,
  detail: "Only proxy admins can view budgets",
};

const DEFAULT_ROWS = [
  budgetRow({ budget_id: "ecc1869c-6231-4380-a56d-1a0be457477d", max_budget: 100, budget_duration: "30d" }),
];

const respondWith = (rows: ReturnType<typeof budgetRow>[], totalCount: number) => {
  getMock.mockResolvedValue({
    data: rows,
    meta: { total_count: totalCount, page: 1, page_size: 50, total_pages: Math.ceil(totalCount / 50) },
  });
};

type QueryRecord = Record<string, string | number>;

const queries = (): QueryRecord[] => getMock.mock.calls.map((call) => (call[1] as { query: QueryRecord }).query);
const lastQuery = (): QueryRecord => queries()[queries().length - 1];
const paths = (): string[] => getMock.mock.calls.map((call) => String(call[0]));

const renderPanel = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <BudgetPanel accessToken="sk-test" />
    </QueryClientProvider>,
  );
};

const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("datatable-filters-trigger"));
  await screen.findByTestId("filter-drawer-body");
};

describe("Budget Panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    respondWith(DEFAULT_ROWS, 1);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the standard page header with the sidebar's Budgets icon", async () => {
    const { container } = renderPanel();

    expect(await screen.findByRole("heading", { level: 1, name: "Budgets" })).toBeInTheDocument();
    expect(screen.getByText("Spend, TPM and RPM limits you can assign to customers.")).toBeInTheDocument();
    expect(container.querySelector(".lucide-wallet")).not.toBeNull();
  });

  it("loads the first page of budgets, newest first", async () => {
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(paths()[0]).toBe("/management/v1/budgets");
    expect(queries()[0]).toEqual({ page: 1, page_size: 50, sort: "-created_at" });
    expect(await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d")).toBeInTheDocument();
  });

  it("asks the server to sort when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await user.click(screen.getByTestId("sort-header-max_budget"));
    await waitFor(() => expect(lastQuery().sort).toBe("-max_budget"));

    await user.click(screen.getByTestId("sort-header-max_budget"));
    await waitFor(() => expect(lastQuery().sort).toBe("max_budget"));

    await user.click(screen.getByTestId("sort-header-budget_id"));
    await waitFor(() => expect(lastQuery().sort).toBe("budget_id"));
  });

  it("searches on budget_id with a debounced q", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId("datatable-search"), { target: { value: "ecc" } });
    await waitFor(() => expect(lastQuery().q).toBe("ecc"));
    expect(queries().some((query) => query.q === "e" || query.q === "ec")).toBe(false);
  });

  it("filters by reset duration and clears it again", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    await user.click(screen.getByTestId("budget-filter-duration-7d"));
    await user.click(screen.getByTestId("budget-filter-duration-30d"));
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(lastQuery()["filter[budget_duration][in]"]).toBe("7d,30d"));

    await user.click(screen.getByTestId("filter-chip-remove-budget_duration"));
    await waitFor(() => expect(lastQuery()).not.toHaveProperty("filter[budget_duration][in]"));
  });

  it("filters by budgets with no reset duration", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    await user.click(screen.getByTestId("budget-filter-duration-__unset__"));
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(lastQuery()["filter[budget_duration][is_null]"]).toBe("true"));
    expect(lastQuery()).not.toHaveProperty("filter[budget_duration][in]");
  });

  it("filters by a max budget range and clears it again", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("budget-filter-max-budget-min"), { target: { value: "10" } });
    fireEvent.change(screen.getByTestId("budget-filter-max-budget-max"), { target: { value: "500" } });
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(lastQuery()["filter[max_budget][gte]"]).toBe("10"));
    expect(lastQuery()["filter[max_budget][lte]"]).toBe("500");

    await user.click(screen.getByTestId("datatable-clear-filters"));
    await waitFor(() => expect(lastQuery()).not.toHaveProperty("filter[max_budget][gte]"));
    expect(lastQuery()).not.toHaveProperty("filter[max_budget][lte]");
  });

  it("filters to unlimited budgets only", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("budget-filter-max-budget-min"), { target: { value: "10" } });
    await user.click(screen.getByTestId("budget-filter-max-budget-unlimited"));
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(lastQuery()["filter[max_budget][is_null]"]).toBe("true"));
    expect(lastQuery()).not.toHaveProperty("filter[max_budget][gte]");
  });

  it("filters by a created date range covering whole local days", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("budget-filter-created-from"), { target: { value: "2026-01-05" } });
    fireEvent.change(screen.getByTestId("budget-filter-created-to"), { target: { value: "2026-01-06" } });
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() =>
      expect(lastQuery()["filter[created_at][gte]"]).toBe(new Date("2026-01-05T00:00:00.000").toISOString()),
    );
    expect(lastQuery()["filter[created_at][lte]"]).toBe(new Date("2026-01-06T23:59:59.999").toISOString());
  });

  it("pages through the results and changes page size", async () => {
    const user = userEvent.setup();
    respondWith(DEFAULT_ROWS, 400);
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await user.click(screen.getByTestId("pagination-next"));
    await waitFor(() => expect(lastQuery().page).toBe(2));
    expect(lastQuery().page_size).toBe(50);

    await user.click(screen.getByTestId("pagination-page-size"));
    await user.click(await screen.findByRole("option", { name: "25" }));
    await waitFor(() => expect(lastQuery().page_size).toBe(25));
  });

  it("renders an access-denied state when the route rejects the caller", async () => {
    getMock.mockRejectedValue(new ApiError("Only proxy admins can view budgets", 403, FORBIDDEN_PROBLEM));
    renderPanel();
    expect(await screen.findByText("You do not have access to budgets")).toBeInTheDocument();
    expect(screen.queryByText("No budgets yet")).not.toBeInTheDocument();
  });

  it("deletes a budget from the actions menu", async () => {
    const user = userEvent.setup();
    budgetDeleteMock.mockResolvedValue(undefined);
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");

    await user.click(screen.getByTestId("budget-actions-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("budget-action-delete"));
    await screen.findByText("Delete Budget?");
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(budgetDeleteMock).toHaveBeenCalledWith("sk-test", "ecc1869c-6231-4380-a56d-1a0be457477d"),
    );
  });

  it("refetches the current page after a delete", async () => {
    const user = userEvent.setup();
    budgetDeleteMock.mockResolvedValue(undefined);
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");
    const before = getMock.mock.calls.length;

    await user.click(screen.getByTestId("budget-actions-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("budget-action-delete"));
    await screen.findByText("Delete Budget?");
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(getMock.mock.calls.length).toBeGreaterThan(before));
  });

  it("renders the Chinese page header, create button and tabs under zh", async () => {
    await i18n.changeLanguage("zh");
    renderPanel();

    expect(await screen.findByRole("heading", { level: 1, name: "预算" })).toBeInTheDocument();
    expect(screen.getByText("可分配给客户的花费、TPM 和 RPM 上限。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建预算" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "预算" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "示例" })).toBeInTheDocument();

    expect(screen.queryByRole("heading", { level: 1, name: "Budgets" })).not.toBeInTheDocument();
    expect(screen.queryByText("Spend, TPM and RPM limits you can assign to customers.")).not.toBeInTheDocument();
  });

  it("renders the Chinese examples copy under zh", async () => {
    await i18n.changeLanguage("zh");
    renderPanel();

    expect(await screen.findByText("如何使用预算 ID")).toBeInTheDocument();
    expect(screen.getByText("为客户分配预算")).toBeInTheDocument();
    expect(screen.getByText("测试（Curl）")).toBeInTheDocument();
    expect(screen.getByText("测试（OpenAI SDK）")).toBeInTheDocument();

    expect(screen.queryByText("How to use budget id")).not.toBeInTheDocument();
    expect(screen.queryByText("Assign Budget to Customer")).not.toBeInTheDocument();
    expect(screen.queryByText("Test it (Curl)")).not.toBeInTheDocument();
    expect(screen.queryByText("Test it (OpenAI SDK)")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete modal copy and success toast under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    budgetDeleteMock.mockResolvedValue(undefined);
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");

    await user.click(screen.getByTestId("budget-actions-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("budget-action-delete"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("删除预算？")).toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除该预算吗？此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).getByText("预算信息")).toBeInTheDocument();
    expect(within(dialog).getByText("预算 ID")).toBeInTheDocument();
    expect(within(dialog).getByText("最大预算")).toBeInTheDocument();
    expect(within(dialog).getByText("TPM")).toBeInTheDocument();
    expect(within(dialog).getByText("RPM")).toBeInTheDocument();
    expect(screen.queryByText("Delete Budget?")).not.toBeInTheDocument();
    expect(screen.queryByText("Budget Information")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("预算删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Budget deleted.");
  });

  it("renders the Chinese delete failure toast under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    budgetDeleteMock.mockRejectedValue(new Error("nope"));
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");

    await user.click(screen.getByTestId("budget-actions-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("budget-action-delete"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除预算失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete budget");
  });
});
