import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import PromptCompressionTab from "./PromptCompressionTab";

const createGuardrailCall = vi.fn();
const getGuardrailsList = vi.fn();

vi.mock("@/components/networking", () => ({
  createGuardrailCall: (...args: unknown[]) => createGuardrailCall(...args),
  getGuardrailsList: (...args: unknown[]) => getGuardrailsList(...args),
}));

const submittedPayload = (): Record<string, unknown> => {
  expect(createGuardrailCall).toHaveBeenCalledTimes(1);
  return createGuardrailCall.mock.calls[0][1] as Record<string, unknown>;
};

describe("PromptCompressionTab submit payload", () => {
  beforeEach(() => {
    createGuardrailCall.mockClear().mockResolvedValue({});
    getGuardrailsList.mockClear().mockResolvedValue({ guardrails: [] });
  });

  it("sends the trimmed name and api base with default_on true", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  headroom-compression  " } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), {
      target: { value: "  https://headroom.example.com  " },
    });
    await user.click(screen.getByRole("button", { name: "Add guardrail" }));

    await vi.waitFor(() =>
      expect(submittedPayload()).toEqual({
        guardrail_name: "headroom-compression",
        litellm_params: {
          guardrail: "headroom",
          mode: "pre_call",
          api_base: "https://headroom.example.com",
          default_on: true,
        },
      }),
    );
    expect(createGuardrailCall.mock.calls[0][0]).toBe("test-token");
  });

  it("sends default_on false once the apply-to-all switch is turned off", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-optin" } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), { target: { value: "https://headroom.example.com" } });
    await user.click(screen.getByLabelText("Apply to all requests"));
    await user.click(screen.getByRole("button", { name: "Add guardrail" }));

    await vi.waitFor(() =>
      expect(submittedPayload()).toEqual({
        guardrail_name: "headroom-optin",
        litellm_params: {
          guardrail: "headroom",
          mode: "pre_call",
          api_base: "https://headroom.example.com",
          default_on: false,
        },
      }),
    );
  });

  it("blocks submission and shows both required messages when the form is empty", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    await user.click(screen.getByRole("button", { name: "Add guardrail" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("API base is required")).toBeInTheDocument();
    expect(createGuardrailCall).not.toHaveBeenCalled();
  });

  it("submits when Enter is pressed inside a text field", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-compression" } });
    await user.type(screen.getByLabelText("Headroom API base"), "https://headroom.example.com{Enter}");

    await vi.waitFor(() => expect(createGuardrailCall).toHaveBeenCalledTimes(1));
  });

  it("clears the name and restores the default switch state after a successful create", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-compression" } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), { target: { value: "https://headroom.example.com" } });
    await user.click(screen.getByLabelText("Apply to all requests"));
    await user.click(screen.getByRole("button", { name: "Add guardrail" }));

    await vi.waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
    expect(screen.getByLabelText("Headroom API base")).toHaveValue("");
    expect(screen.getByLabelText("Apply to all requests")).toBeChecked();
    expect(getGuardrailsList).toHaveBeenCalledTimes(2);
  });

  it("keeps the always-on and opt-in badges for the guardrails it lists", async () => {
    getGuardrailsList.mockResolvedValue({
      guardrails: [
        {
          guardrail_id: "g-1",
          guardrail_name: "always-on-one",
          litellm_params: { guardrail: "headroom", api_base: "https://a.example.com", default_on: true },
        },
        {
          guardrail_id: "g-2",
          guardrail_name: "opt-in-one",
          litellm_params: { guardrail: "headroom", api_base: "https://b.example.com", default_on: false },
        },
      ],
    });
    render(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("Always on")).toBeInTheDocument();
    expect(screen.getByText("Opt-in")).toBeInTheDocument();
    expect(screen.getByText("https://a.example.com")).toBeInTheDocument();
  });
});

describe("PromptCompressionTab Chinese copy", () => {
  beforeEach(async () => {
    createGuardrailCall.mockClear().mockResolvedValue({});
    getGuardrailsList.mockClear().mockResolvedValue({ guardrails: [] });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.fromError).mockClear();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese chrome, description and warning and hides the English", async () => {
    render(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("Headroom 提示词压缩")).toBeInTheDocument();
    expect(screen.getByText(/Headroom 是 LiteLLM 原生的护栏/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Headroom 配置文档" })).toBeInTheDocument();
    expect(screen.getByText("添加 Headroom 压缩护栏")).toBeInTheDocument();
    expect(screen.getByLabelText("名称")).toBeInTheDocument();
    expect(screen.getByLabelText("Headroom API Base")).toBeInTheDocument();
    expect(screen.getByText("你的 Headroom 压缩服务所托管的 URL")).toBeInTheDocument();
    expect(screen.getByLabelText("应用到所有请求")).toBeInTheDocument();
    expect(screen.getByText(/对所有请求应用压缩面向所有用户开放/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "这里" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加护栏" })).toBeInTheDocument();

    expect(screen.queryByText("Headroom prompt compression")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Headroom compression guardrail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Headroom API base")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Apply to all requests")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add guardrail" })).not.toBeInTheDocument();
  });

  /* eslint-disable testing-library/no-node-access -- The tooltip trigger is an icon with no accessible name, so reaching its portal needs the DOM */
  it("renders the Chinese API base hint in a tooltip and hides the English one", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    const trigger = screen.getByText("Headroom API Base").querySelector("svg");
    expect(trigger).toBeTruthy();
    await user.hover(trigger as SVGElement);

    expect(
      await screen.findByText("你的 Headroom 压缩服务的 Base URL（LiteLLM 会调用其 /v1/compress Endpoint）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Base URL of your Headroom compression service (LiteLLM calls its /v1/compress endpoint)"),
    ).not.toBeInTheDocument();
  });

  it("shows the Chinese loading state and empty state and hides the English ones", async () => {
    getGuardrailsList.mockReturnValue(new Promise(() => {}));
    render(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    cleanup();
    getGuardrailsList.mockResolvedValue({ guardrails: [] });
    render(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("尚未配置提示词压缩护栏。在下方添加一个即可开始节省输入 Token")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No prompt compression guardrails configured yet. Add one below to start saving on input tokens",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese always-on and opt-in badges and hides the English ones", async () => {
    getGuardrailsList.mockResolvedValue({
      guardrails: [
        {
          guardrail_id: "g-1",
          guardrail_name: "always-on-one",
          litellm_params: { guardrail: "headroom", api_base: "https://a.example.com", default_on: true },
        },
        {
          guardrail_id: "g-2",
          guardrail_name: "opt-in-one",
          litellm_params: { guardrail: "headroom", api_base: "https://b.example.com", default_on: false },
        },
      ],
    });
    render(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("始终开启")).toBeInTheDocument();
    expect(screen.getByText("按需启用")).toBeInTheDocument();
    expect(screen.queryByText("Always on")).not.toBeInTheDocument();
    expect(screen.queryByText("Opt-in")).not.toBeInTheDocument();
  });

  it("shows both Chinese required messages when the form is empty", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    await user.click(screen.getByRole("button", { name: "添加护栏" }));

    expect(await screen.findByText("请输入名称")).toBeInTheDocument();
    expect(screen.getByText("请输入 API Base")).toBeInTheDocument();
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    expect(screen.queryByText("API base is required")).not.toBeInTheDocument();
  });

  it("reports a Chinese load failure toast and hides the English message", async () => {
    getGuardrailsList.mockRejectedValue(new Error("boom"));
    render(<PromptCompressionTab accessToken="test-token" />);

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载压缩护栏失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load compression guardrails");
  });

  it("reports a Chinese success toast after creating a guardrail", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("名称"), { target: { value: "headroom-compression" } });
    fireEvent.change(screen.getByLabelText("Headroom API Base"), { target: { value: "https://a.example.com" } });
    await user.click(screen.getByRole("button", { name: "添加护栏" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("压缩护栏已创建"));
    expect(toast.success).not.toHaveBeenCalledWith("Compression guardrail created");
  });

  it("reports a Chinese create failure toast and hides the English message", async () => {
    const user = userEvent.setup();
    createGuardrailCall.mockRejectedValue(new Error("boom"));
    render(<PromptCompressionTab accessToken="test-token" />);

    fireEvent.change(screen.getByLabelText("名称"), { target: { value: "headroom-compression" } });
    fireEvent.change(screen.getByLabelText("Headroom API Base"), { target: { value: "https://a.example.com" } });
    await user.click(screen.getByRole("button", { name: "添加护栏" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建压缩护栏失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create compression guardrail");
  });
});
