import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { Policy } from "@/components/policies/types";

import PolicyTable from "./PolicyTable";

const makePolicy = (overrides: Partial<Policy> = {}): Policy => ({
  policy_id: "policy-id-1",
  policy_name: "test-policy",
  inherit: null,
  description: null,
  guardrails_add: [],
  guardrails_remove: [],
  condition: null,
  ...overrides,
});

const defaultProps = {
  policies: [],
  isLoading: false,
  onDeleteClick: vi.fn(),
  onEditClick: vi.fn(),
  onViewClick: vi.fn(),
  isAdmin: true,
};

const CONFIG_HINT_ZH = "Config 策略在配置文件中定义，无法在仪表板中编辑或删除。";
const CONFIG_HINT_EN =
  "Config policies are defined in the config file and cannot be edited or deleted from the dashboard.";

describe("PolicyTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderWithProviders(<PolicyTable {...defaultProps} />);

    for (const [zh, en] of [
      ["名称", "Name"],
      ["描述", "Description"],
      ["继承自", "Inherits From"],
      ["Guardrails（添加）", "Guardrails (Add)"],
      ["Guardrails（移除）", "Guardrails (Remove)"],
      ["模型条件", "Model Condition"],
      ["创建时间", "Created At"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese loading message while loading", () => {
    renderWithProviders(<PolicyTable {...defaultProps} isLoading />);

    expect(screen.getByText("正在加载策略…")).toBeInTheDocument();
    expect(screen.queryByText("Loading policies…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state", () => {
    renderWithProviders(<PolicyTable {...defaultProps} />);

    expect(screen.getByText("未找到策略")).toBeInTheDocument();
    expect(screen.queryByText("No policies found")).not.toBeInTheDocument();
    expect(screen.getByText("创建策略来打包 Guardrails，并将其应用到各个团队。")).toBeInTheDocument();
    expect(
      screen.queryByText("Create a policy to bundle guardrails and apply them across teams."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese unnamed policy fallback", () => {
    renderWithProviders(<PolicyTable {...defaultProps} policies={[makePolicy({ policy_name: "" })]} />);

    expect(screen.getByText("（未命名）")).toBeInTheDocument();
    expect(screen.queryByText("(unnamed)")).not.toBeInTheDocument();
  });

  it("renders the Chinese version count badge", () => {
    const publishedVersion: Partial<Policy> = {
      policy_name: "versioned",
      policy_id: "v1",
      version_status: "published",
      version_number: 1,
    };
    const productionVersion: Partial<Policy> = {
      policy_name: "versioned",
      policy_id: "v2",
      version_status: "production",
      version_number: 2,
    };
    const policies = [makePolicy(publishedVersion), makePolicy(productionVersion)];
    renderWithProviders(<PolicyTable {...defaultProps} policies={policies} />);

    expect(screen.getByText("2 个版本")).toBeInTheDocument();
    expect(screen.queryByText("2 versions")).not.toBeInTheDocument();
  });

  it("renders the Chinese config badge and the Chinese config hint on the disabled actions", async () => {
    const user = userEvent.setup();
    const configPolicy = makePolicy({
      policy_name: "config-policy",
      policy_id: "config-policy",
      definition_location: "config",
    });
    renderWithProviders(<PolicyTable {...defaultProps} policies={[configPolicy]} />);

    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.queryByText("Config")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("policy-actions-config-policy"));

    expect(await screen.findByTestId("policy-action-edit")).toHaveAttribute("title", CONFIG_HINT_ZH);
    expect(screen.getByTestId("policy-action-delete")).toHaveAttribute("title", CONFIG_HINT_ZH);
    expect(screen.queryByTitle(CONFIG_HINT_EN)).not.toBeInTheDocument();
  });

  it("renders the Chinese row action labels and aria label", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTable {...defaultProps} policies={[makePolicy()]} />);

    const trigger = screen.getByTestId("policy-actions-policy-id-1");
    expect(trigger).toHaveAttribute("aria-label", "打开策略操作");
    expect(screen.queryByLabelText("Open policy actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByTestId("policy-action-edit")).toHaveTextContent("编辑策略");
    expect(screen.getByTestId("policy-action-delete")).toHaveTextContent("删除策略");
    expect(screen.queryByText("Edit policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete policy")).not.toBeInTheDocument();
  });
});
