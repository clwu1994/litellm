import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import MessageBubble from "./MessageBubble";

vi.mock("@/components/chat_ui/ResponseMetrics", () => ({ default: () => <div>metrics</div> }));

describe("MessageBubble Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese user role label and hides the raw English value", () => {
    renderWithProviders(<MessageBubble message={{ role: "user", content: "Hello" }} />);

    expect(screen.getByText("用户")).toBeInTheDocument();
    expect(screen.queryByText("user")).not.toBeInTheDocument();
  });

  it("renders the Chinese assistant role label and hides the raw English value", () => {
    renderWithProviders(<MessageBubble message={{ role: "assistant", content: "Hello", model: "gpt-4o" }} />);

    expect(screen.getByText("助手")).toBeInTheDocument();
    expect(screen.queryByText("assistant")).not.toBeInTheDocument();
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("renders the raw role value byte-identically in English", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<MessageBubble message={{ role: "user", content: "Hello" }} />);

    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.queryByText("用户")).not.toBeInTheDocument();
  });
});
