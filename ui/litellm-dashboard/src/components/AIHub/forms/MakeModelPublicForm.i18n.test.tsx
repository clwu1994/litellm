import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MakeModelPublicForm from "./MakeModelPublicForm";

vi.mock("../../networking", () => ({
  makeModelGroupPublic: vi.fn(),
}));

vi.mock("../../model_filters", () => ({
  default: () => <div data-testid="model-filters" />,
}));

import { makeModelGroupPublic } from "../../networking";

const model = (overrides: Record<string, unknown> = {}) => ({
  model_group: "gpt-4",
  providers: ["openai"],
  max_input_tokens: 8192,
  max_output_tokens: 4096,
  input_cost_per_token: 0.03,
  output_cost_per_token: 0.06,
  mode: "chat",
  tpm: 10000,
  rpm: 200,
  supports_parallel_function_calling: true,
  supports_vision: false,
  supports_function_calling: true,
  supported_openai_params: ["temperature"],
  is_public_model_group: false,
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

describe("MakeModelPublicForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the step one copy in Chinese and hides the English originals", () => {
    render(<MakeModelPublicForm {...baseProps} modelHubData={[model()]} />);

    expectLocalized("将模型设为公开", "Make Models Public");
    expectLocalized("选择要设为公开的模型", "Select Models to Make Public");
    expectLocalized("选择模型", "Select Models");
    expectLocalized("确认", "Confirm");
    expectLocalized(
      "选择你希望在公共 Model Hub 上可见的模型。用户仍需有效的 Virtual Key 才能使用这些模型。",
      "Select the models you want to be visible on the public model hub. Users will still require a valid Virtual Key to use these models.",
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选 (1)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders the empty state and the disabled select-all in Chinese and hides the English originals", () => {
    render(<MakeModelPublicForm {...baseProps} modelHubData={[]} />);

    expectLocalized("没有模型符合当前筛选条件。", "No models match the current filters.");
    expect(screen.getByRole("checkbox", { name: "全选" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select All" })).not.toBeInTheDocument();
  });

  it("renders the selected and total counts in Chinese with the full rendered strings", async () => {
    render(<MakeModelPublicForm {...baseProps} modelHubData={[model({ is_public_model_group: true })]} />);

    const selected = screen.getByText("个模型已选中");
    expect(selected).toHaveTextContent("1 个模型已选中");
    expect(screen.queryByText("model selected")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expectLocalized("确认将模型设为公开", "Confirm Making Models Public");
    expectLocalized("要设为公开的模型：", "Models to be made public:");
    expectLocalized("警告：", "Warning:");
    expectLocalized("设为公开", "Make Public");
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();

    expect(findParagraph("总计： 1 个模型将被设为公开")).toBeInTheDocument();
    expect(hasParagraphText("Total: 1 model will be made public")).toBe(false);
  });

  it("renders the plural total count in Chinese and hides the English original", async () => {
    render(
      <MakeModelPublicForm
        {...baseProps}
        modelHubData={[
          model({ is_public_model_group: true }),
          model({ model_group: "gpt-3.5-turbo", is_public_model_group: true }),
        ]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(findParagraph("总计： 2 个模型将被设为公开")).toBeInTheDocument();
    expect(hasParagraphText("Total: 2 models will be made public")).toBe(false);
    expect(screen.queryByText("models selected")).not.toBeInTheDocument();
  });

  it("renders the warning body in Chinese and hides the English original while keeping the route literal", async () => {
    render(<MakeModelPublicForm {...baseProps} modelHubData={[model({ is_public_model_group: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(
      findParagraph("警告： 一旦你将这些模型设为公开，任何能访问 /ui/model_hub_table 的人都能知道它们存在于该代理上。"),
    ).toBeInTheDocument();
    expect(screen.getByText("/ui/model_hub_table")).toBeInTheDocument();
    expect(
      hasParagraphText(
        "Warning: Once you make these models public, anyone who can go to the /ui/model_hub_table will be able to know they exist on the proxy.",
      ),
    ).toBe(false);
  });

  it("reports the success toast in Chinese and not in English", async () => {
    vi.mocked(makeModelGroupPublic).mockResolvedValueOnce({});
    render(
      <MakeModelPublicForm
        {...baseProps}
        modelHubData={[
          model({ is_public_model_group: true }),
          model({ model_group: "gpt-3.5-turbo", is_public_model_group: true }),
        ]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("已成功将 2 个模型组设为公开！");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Successfully made 2 model group(s) public!");
  });

  it("reports the failure toast in Chinese and not in English", async () => {
    vi.mocked(makeModelGroupPublic).mockRejectedValueOnce(new Error("boom"));
    render(<MakeModelPublicForm {...baseProps} modelHubData={[model({ is_public_model_group: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("将模型组设为公开失败。请重试。");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to make model groups public. Please try again.");
  });

  it("reports the empty-selection guard in Chinese and not in English", async () => {
    const { rerender } = render(
      <MakeModelPublicForm {...baseProps} modelHubData={[model({ is_public_model_group: true })]} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    rerender(<MakeModelPublicForm {...baseProps} modelHubData={[model({ model_group: "gpt-3.5-turbo" })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    expect(toast.fromError).toHaveBeenCalledWith("请至少选择一个要设为公开的模型");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select at least one model to make public");
  });
});

describe("MakeModelPublicForm English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural total counts byte-identical", async () => {
    render(<MakeModelPublicForm {...baseProps} modelHubData={[model({ is_public_model_group: true })]} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(findParagraph("Total: 1 model will be made public")).toBeInTheDocument();
    cleanup();

    render(
      <MakeModelPublicForm
        {...baseProps}
        modelHubData={[
          model({ is_public_model_group: true }),
          model({ model_group: "gpt-3.5-turbo", is_public_model_group: true }),
        ]}
      />,
    );
    expect(findParagraph("2 models selected")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(findParagraph("Total: 2 models will be made public")).toBeInTheDocument();
    expect(
      findParagraph(
        "Warning: Once you make these models public, anyone who can go to the /ui/model_hub_table will be able to know they exist on the proxy.",
      ),
    ).toBeInTheDocument();
  });
});
