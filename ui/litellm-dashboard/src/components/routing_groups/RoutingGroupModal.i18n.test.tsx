import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import RoutingGroupModal from "./RoutingGroupModal";
import type { RoutingGroup } from "./types";

const STRATEGIES = ["simple-shuffle", "latency-based-routing"];

const renderModal = (overrides: Partial<React.ComponentProps<typeof RoutingGroupModal>> = {}) =>
  renderWithProviders(
    <RoutingGroupModal
      open
      mode="create"
      initialValue={null}
      availableStrategies={STRATEGIES}
      strategyDescriptions={{}}
      modelOptions={["gpt-4o"]}
      existingGroupNames={[]}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      saving={false}
      {...overrides}
    />,
  );

const pickStrategy = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByLabelText("路由策略"));
  await user.click(await screen.findByRole("option", { name }));
};

describe("RoutingGroupModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the create dialog copy in Chinese", () => {
    renderModal();

    expect(screen.getByText("创建路由分组")).toBeInTheDocument();
    expect(screen.queryByText("Create Routing Group")).not.toBeInTheDocument();
    expect(screen.getByLabelText("分组名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Group Name")).not.toBeInTheDocument();
    expect(
      screen.getByText("在 API 调用中使用此名称作为模型名，LiteLLM 会将请求路由到该分组中的某个模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Use this name as the model in API calls — LiteLLM routes the request to one of the group's models.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Models")).not.toBeInTheDocument();
    expect(screen.getByText("来自你的模型列表、此分组会在其间路由的模型。")).toBeInTheDocument();
    expect(screen.queryByText("Models from your model list that this group routes between.")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models")).not.toBeInTheDocument();
    expect(screen.getByLabelText("路由策略")).toBeInTheDocument();
    expect(screen.getByText("未被显式分组占用的模型将回退到代理的顶层路由策略。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Models not claimed by an explicit group fall through to the proxy's top-level routing strategy.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建分组" })).toBeInTheDocument();
  });

  it("renders the edit title and save action in Chinese", () => {
    const group: RoutingGroup = { group_name: "prod-group", models: ["gpt-4o"], routing_strategy: "simple-shuffle" };
    renderModal({ mode: "edit", initialValue: group });

    expect(screen.getByText("编辑 prod-group")).toBeInTheDocument();
    expect(screen.queryByText("Edit prod-group")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the strategy-arguments field and example in Chinese", async () => {
    const user = userEvent.setup();
    renderModal();

    await pickStrategy(user, "latency-based-routing");

    expect(await screen.findByLabelText("策略参数（JSON）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Strategy Arguments (JSON)")).not.toBeInTheDocument();
    expect(screen.getByText('示例：{ "ttl": 3600, "lowest_latency_buffer": 0 }')).toBeInTheDocument();
    expect(screen.queryByText('Example: { "ttl": 3600, "lowest_latency_buffer": 0 }')).not.toBeInTheDocument();
  });

  it("renders the empty model combobox message in Chinese", async () => {
    const user = userEvent.setup();
    renderModal({ modelOptions: [] });

    await user.click(screen.getByLabelText("模型"));

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the required-field validation messages in Chinese", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "创建分组" }));

    expect(await screen.findByText("分组名称为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Group name is required")).not.toBeInTheDocument();
    expect(screen.getByText("至少选择一个模型")).toBeInTheDocument();
    expect(screen.queryByText("Select at least one model")).not.toBeInTheDocument();
  });

  it("renders the duplicate-name and max-length validation messages in Chinese", async () => {
    const user = userEvent.setup();
    renderModal({ existingGroupNames: ["taken"] });

    await user.type(screen.getByLabelText("分组名称"), "taken");
    await user.click(screen.getByRole("button", { name: "创建分组" }));

    expect(await screen.findByText("已存在同名分组")).toBeInTheDocument();
    expect(screen.queryByText("A group with this name already exists")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("分组名称"));
    await user.type(screen.getByLabelText("分组名称"), "x".repeat(65));
    await user.click(screen.getByRole("button", { name: "创建分组" }));

    expect(await screen.findByText("必须不超过 64 个字符")).toBeInTheDocument();
    expect(screen.queryByText("Must be 64 characters or fewer")).not.toBeInTheDocument();
  });

  it("renders the strategy-required message when an edited group has no strategy", async () => {
    const user = userEvent.setup();
    const group = { group_name: "broken", models: ["gpt-4o"], routing_strategy: "" } as RoutingGroup;
    renderModal({ mode: "edit", initialValue: group, availableStrategies: [] });

    expect(screen.getByText("选择策略")).toBeInTheDocument();
    expect(screen.queryByText("Select strategy")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("策略为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Strategy is required")).not.toBeInTheDocument();
  });

  it("renders the invalid-JSON message in Chinese", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("分组名称"), "fast-chat");
    await user.click(screen.getByLabelText("模型"));
    await user.click(await screen.findByRole("option", { name: "gpt-4o" }));
    await pickStrategy(user, "latency-based-routing");
    fireEvent.change(await screen.findByLabelText("策略参数（JSON）"), { target: { value: "{ttl:}" } });
    await user.click(screen.getByRole("button", { name: "创建分组" }));

    expect(await screen.findByText("必须是有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Must be valid JSON")).not.toBeInTheDocument();
  });
});
