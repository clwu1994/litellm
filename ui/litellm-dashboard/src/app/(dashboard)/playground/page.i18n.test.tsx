import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import PlaygroundPage from "./page";

const authState = { userRole: "Admin" };

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    token: "token-1",
    accessToken: "sk-test",
    userId: "user-1",
    userRole: authState.userRole,
    isViewOnly: ["Admin Viewer", "Internal Viewer"].includes(authState.userRole),
    disabledPersonalKeyCreation: false,
  }),
}));

vi.mock("@/utils/proxyUtils", () => ({
  fetchProxySettings: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/app/(dashboard)/playground/components/chat_ui/ChatUI", () => ({
  default: () => <div data-testid="chat-ui" />,
}));

vi.mock("@/app/(dashboard)/playground/components/compareUI/CompareUI", () => ({
  default: () => <div data-testid="compare-ui" />,
}));

vi.mock("@/app/(dashboard)/playground/components/complianceUI/ComplianceUI", () => ({
  default: () => <div data-testid="compliance-ui" />,
}));

vi.mock("@/app/(dashboard)/playground/components/chat_ui/AgentBuilderView", () => ({
  default: () => <div data-testid="agent-builder" />,
}));

describe("PlaygroundPage Chinese copy", () => {
  beforeEach(async () => {
    authState.userRole = "Admin";
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese access-denied title and body", () => {
    authState.userRole = "Admin Viewer";
    render(<PlaygroundPage />);

    expect(screen.getByText("访问被拒绝")).toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    expect(screen.getByText("你的角色无权访问 Playground。请联系代理管理员开通测试模型的权限。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your role does not have access to the Playground. Ask your proxy admin for access to test models.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders each Chinese tab label with its English original absent", () => {
    render(<PlaygroundPage />);

    expect(screen.getByRole("tab", { name: "对话" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Chat" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "对比" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Compare" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "合规" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Compliance" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Agent Builder（实验性）" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Agent Builder (Experimental)" })).not.toBeInTheDocument();
  });
});
