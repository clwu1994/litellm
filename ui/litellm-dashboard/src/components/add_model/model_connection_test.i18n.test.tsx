import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import ModelConnectionTest from "./model_connection_test";

const mockPrepareModelAddRequest = vi.fn();
const mockTestConnectionRequest = vi.fn();

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("../networking", () => ({
  testConnectionRequest: (...args: unknown[]) => mockTestConnectionRequest(...args),
}));

vi.mock("./handle_add_model_submit", () => ({
  prepareModelAddRequest: (...args: unknown[]) => mockPrepareModelAddRequest(...args),
}));

const writeText = vi.fn();

const FALLBACK_MODEL_NAME = "此模型";
const TESTING_FALLBACK = "正在测试与 此模型 的连接...";

const renderTest = (modelName?: string) =>
  render(<ModelConnectionTest formValues={{}} accessToken="token" testMode="chat" modelName={modelName} />);

const successResponse = { status: "success" };

const failureResponse = {
  status: "error",
  result: {
    error: "boom",
    raw_request_typed_dict: {
      raw_request_api_base: "http://localhost:4000/v1/chat/completions",
      raw_request_body: { model: "gpt-4" },
      raw_request_headers: { "Content-Type": "application/json" },
    },
  },
};

describe("ModelConnectionTest Chinese copy", () => {
  beforeEach(async () => {
    mockPrepareModelAddRequest.mockResolvedValue([{ litellmParamsObj: {}, modelInfoObj: {} }]);
    mockTestConnectionRequest.mockResolvedValue(successResponse);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese testing message and the Chinese fallback model name", () => {
    renderTest();

    expect(screen.getByText(TESTING_FALLBACK)).toBeInTheDocument();
    expect(screen.getByText(TESTING_FALLBACK)).toHaveTextContent(`正在测试与 ${FALLBACK_MODEL_NAME} 的连接...`);
    expect(screen.queryByText("Testing connection to this model...")).not.toBeInTheDocument();
  });

  it("renders the Chinese success message and the Chinese success toast", async () => {
    renderTest("gpt-4");

    expect(await screen.findByText("已成功连接到 gpt-4！")).toBeInTheDocument();
    expect(screen.queryByText("Connection to gpt-4 successful!")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("连接测试成功！");
  });

  it("renders the Chinese failure, error and detail labels, and the Chinese copied toast", async () => {
    mockTestConnectionRequest.mockResolvedValue(failureResponse);
    const user = userEvent.setup();
    renderTest("gpt-4");

    expect(await screen.findByText("连接到 gpt-4 失败")).toBeInTheDocument();
    expect(screen.queryByText("Connection to gpt-4 failed")).not.toBeInTheDocument();
    expect(screen.getByText("错误：")).toBeInTheDocument();
    expect(screen.queryByText("Error:")).not.toBeInTheDocument();

    const showDetails = screen.getByRole("button", { name: "显示详情" });
    expect(screen.queryByRole("button", { name: "Show Details" })).not.toBeInTheDocument();

    await user.click(showDetails);

    expect(screen.getByText("故障排查详情")).toBeInTheDocument();
    expect(screen.queryByText("Troubleshooting Details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "隐藏详情" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide Details" })).not.toBeInTheDocument();

    expect(screen.getByText("API 请求")).toBeInTheDocument();
    expect(screen.queryByText("API Request")).not.toBeInTheDocument();

    const copy = screen.getByRole("button", { name: "复制到剪贴板" });
    expect(screen.queryByRole("button", { name: "Copy to Clipboard" })).not.toBeInTheDocument();

    await user.click(copy);
    expect(toast.success).toHaveBeenCalledWith("已复制到剪贴板");
    expect(screen.getByRole("button", { name: "查看文档" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View Documentation" })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-request-data placeholder and the Chinese unknown error", async () => {
    mockTestConnectionRequest.mockResolvedValue({ status: "error" });
    renderTest("gpt-4");

    expect(await screen.findByText("未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
    expect(screen.getByText("无可用请求数据")).toBeInTheDocument();
    expect(screen.queryByText("No request data available")).not.toBeInTheDocument();
  });

  it("renders the Chinese prepare-failure message when the request cannot be prepared", async () => {
    mockPrepareModelAddRequest.mockResolvedValue(null);
    renderTest("gpt-4");

    expect(await screen.findByText("准备模型数据失败。请检查表单输入。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to prepare model data. Please check your form inputs.")).not.toBeInTheDocument();
  });
});
