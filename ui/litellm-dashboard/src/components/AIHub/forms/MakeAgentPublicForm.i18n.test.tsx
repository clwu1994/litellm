import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MakeAgentPublicForm from "./MakeAgentPublicForm";

vi.mock("../../networking", () => ({
  makeAgentsPublicCall: vi.fn(),
}));

import { makeAgentsPublicCall } from "../../networking";

const agent = (overrides: Record<string, unknown> = {}) => ({
  agent_id: "agent-1",
  protocolVersion: "1.0",
  name: "Billing Router",
  description: "routes billing questions",
  url: "https://agent.example.com",
  version: "2.0",
  skills: [],
  is_public: false,
  ...overrides,
});

const baseProps = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "test-token",
  onSuccess: vi.fn(),
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const findParagraph = (text: string): HTMLElement =>
  screen.getByText((_, el) => el?.tagName === "P" && normalize(el.textContent ?? "") === normalize(text));

const hasParagraphText = (text: string): boolean =>
  screen.queryAllByText((_, el) => el?.tagName === "P" && normalize(el.textContent ?? "") === normalize(text)).length >
  0;

describe("MakeAgentPublicForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the step one copy in Chinese and hides the English originals", () => {
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent()]} />);

    expectLocalized("将 Agent 设为公开", "Make Agents Public");
    expectLocalized("选择要设为公开的 Agent", "Select Agents to Make Public");
    expectLocalized("选择 Agent", "Select Agents");
    expectLocalized("确认", "Confirm");
    expectLocalized(
      "选择你希望在公共 Model Hub 上可见的 Agent。用户仍需有效的 Virtual Key 才能使用这些 Agent。",
      "Select the agents you want to be visible on the public model hub. Users will still require a valid Virtual Key to use these agents.",
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选 (1)" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select All (1)" })).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", () => {
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[]} />);

    expectLocalized("没有可用的 Agent。", "No agents available.");
    expect(screen.getByRole("checkbox", { name: "全选" })).toBeInTheDocument();
  });

  it("renders the selected and total counts in Chinese with the full rendered strings", async () => {
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent({ is_public: true })]} />);

    expect(screen.getByText("个 Agent 已选中")).toHaveTextContent("1 个 Agent 已选中");
    expect(screen.queryByText("agent selected")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expectLocalized("确认将 Agent 设为公开", "Confirm Making Agents Public");
    expectLocalized("要设为公开的 Agent：", "Agents to be made public:");
    expectLocalized("警告：", "Warning:");
    expectLocalized("设为公开", "Make Public");
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();

    expect(findParagraph("总计： 1 个 Agent 将被设为公开")).toBeInTheDocument();
    expect(hasParagraphText("Total: 1 agent will be made public")).toBe(false);
  });

  it("renders the plural total count in Chinese and hides the English original", async () => {
    render(
      <MakeAgentPublicForm
        {...baseProps}
        agentHubData={[agent({ is_public: true }), agent({ agent_id: "agent-2", name: "Support", is_public: true })]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(findParagraph("总计： 2 个 Agent 将被设为公开")).toBeInTheDocument();
    expect(hasParagraphText("Total: 2 agents will be made public")).toBe(false);
    expect(screen.queryByText("agents selected")).not.toBeInTheDocument();
  });

  it("renders the skills overflow count in Chinese and hides the English original", () => {
    render(
      <MakeAgentPublicForm
        {...baseProps}
        agentHubData={[
          agent({
            skills: [
              { id: "s1", name: "Skill 1", description: "d" },
              { id: "s2", name: "Skill 2", description: "d" },
              { id: "s3", name: "Skill 3", description: "d" },
              { id: "s4", name: "Skill 4", description: "d" },
              { id: "s5", name: "Skill 5", description: "d" },
            ],
          }),
        ]}
      />,
    );

    expectLocalized("还有 2 个", "+2 more");
  });

  it("renders the warning body in Chinese and hides the English original while keeping the route literal", async () => {
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent({ is_public: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(
      findParagraph(
        "警告： 一旦你将这些 Agent 设为公开，任何能访问 /ui/model_hub_table 的人都能知道它们存在于该代理上。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("/ui/model_hub_table")).toBeInTheDocument();
    expect(
      hasParagraphText(
        "Warning: Once you make these agents public, anyone who can go to the /ui/model_hub_table will be able to know they exist on the proxy.",
      ),
    ).toBe(false);
  });

  it("reports the success toast in Chinese and not in English", async () => {
    vi.mocked(makeAgentsPublicCall).mockResolvedValueOnce({});
    render(
      <MakeAgentPublicForm
        {...baseProps}
        agentHubData={[agent({ is_public: true }), agent({ agent_id: "agent-2", name: "Support", is_public: true })]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("已成功将 2 个 Agent 设为公开！");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Successfully made 2 agent(s) public!");
  });

  it("reports the failure toast in Chinese and not in English", async () => {
    vi.mocked(makeAgentsPublicCall).mockRejectedValueOnce(new Error("boom"));
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent({ is_public: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("将 Agent 设为公开失败。请重试。");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to make agents public. Please try again.");
  });

  it("reports the empty-selection guard in Chinese and not in English", async () => {
    const { rerender } = render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent({ is_public: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    rerender(
      <MakeAgentPublicForm
        {...baseProps}
        agentHubData={[agent({ agent_id: "agent-2", name: "Support", is_public: false })]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    expect(toast.fromError).toHaveBeenCalledWith("请至少选择一个要设为公开的 Agent");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select at least one agent to make public");
  });
});

describe("MakeAgentPublicForm English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural agent counts byte-identical", async () => {
    render(<MakeAgentPublicForm {...baseProps} agentHubData={[agent({ is_public: true })]} />);
    expect(findParagraph("1 agent selected")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(findParagraph("Total: 1 agent will be made public")).toBeInTheDocument();
    cleanup();

    render(
      <MakeAgentPublicForm
        {...baseProps}
        agentHubData={[agent({ is_public: true }), agent({ agent_id: "agent-2", name: "Support", is_public: true })]}
      />,
    );
    expect(findParagraph("2 agents selected")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(findParagraph("Total: 2 agents will be made public")).toBeInTheDocument();
    expect(
      findParagraph(
        "Warning: Once you make these agents public, anyone who can go to the /ui/model_hub_table will be able to know they exist on the proxy.",
      ),
    ).toBeInTheDocument();
  });
});
