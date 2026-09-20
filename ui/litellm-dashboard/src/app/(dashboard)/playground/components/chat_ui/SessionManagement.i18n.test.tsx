import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import SessionManagement from "./SessionManagement";

const renderSession = (props: Partial<React.ComponentProps<typeof SessionManagement>> = {}) =>
  render(
    <SessionManagement
      endpointType={EndpointType.RESPONSES}
      responsesSessionId={null}
      useApiSessionManagement={false}
      onToggleSessionManagement={vi.fn()}
      {...props}
    />,
  );

describe("SessionManagement Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese UI session ready state and its tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderSession();

    expect(screen.getByText("会话管理")).toBeInTheDocument();
    expect(screen.queryByText("Session Management")).not.toBeInTheDocument();
    expect(screen.getByText("UI")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByLabelText("使用 API 会话管理")).toBeInTheDocument();
    expect(screen.queryByLabelText("Use API session management")).not.toBeInTheDocument();

    expect(screen.getByText("UI 会话：就绪")).toBeInTheDocument();
    expect(screen.queryByText("UI Session: Ready")).not.toBeInTheDocument();
    expect(screen.getByText("UI 将使用聊天记录管理会话")).toBeInTheDocument();
    expect(screen.queryByText("UI will manage session using chat history")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("关于会话管理"));
    expect(
      await screen.findByText(
        "在 LiteLLM API 会话管理（使用 previous_response_id）和基于 UI 的会话管理（使用聊天记录）之间选择",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Choose between LiteLLM API session management (using previous_response_id) or UI-based session management (using chat history)",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese API session ready state", () => {
    renderSession({ useApiSessionManagement: true });

    expect(screen.getByText("API 会话：就绪")).toBeInTheDocument();
    expect(screen.queryByText("API Session: Ready")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 将使用 previous_response_id 管理会话")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM will manage session using previous_response_id")).not.toBeInTheDocument();
  });

  it("renders the Chinese UI session id state", () => {
    renderSession({ responsesSessionId: "abcdefghijklmno" });

    expect(screen.getByText("UI 会话: abcdefghij...")).toBeInTheDocument();
    expect(screen.queryByText("UI Session: abcdefghij...")).not.toBeInTheDocument();
    expect(screen.getByText("UI 会话已激活，上下文在客户端维护")).toBeInTheDocument();
    expect(screen.queryByText("UI session active - context maintained client-side")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制 Response ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy response ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese API session id state and its copy tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderSession({ responsesSessionId: "abcdefghijklmno", useApiSessionManagement: true });

    expect(screen.getByText("Response ID: abcdefghij...")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM API 会话已激活，上下文在服务端维护")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM API session active - context maintained server-side")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("复制 Response ID"));
    expect(await screen.findByText("复制 Response ID 以继续会话：")).toBeInTheDocument();
    expect(screen.queryByText("Copy response ID to continue session:")).not.toBeInTheDocument();
  });

  it("reports a successful and a failed Chinese copy", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    renderSession({ responsesSessionId: "abcdefghijklmno", useApiSessionManagement: true });
    await user.click(screen.getByLabelText("复制 Response ID"));
    expect(toast.success).toHaveBeenCalledWith("Response ID 已复制到剪贴板！");

    writeText.mockRejectedValueOnce(new Error("denied"));
    await user.click(screen.getByLabelText("复制 Response ID"));
    expect(toast.error).toHaveBeenCalledWith("无法复制 Response ID");
  });
});
