import React from "react";
import { cleanup, render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { OutputCard } from "./OutputCard";
import { ParsedMessage } from "./prettyMessagesTypes";

describe("OutputCard", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);
  const mockMessage: ParsedMessage = {
    role: "assistant",
    content: "This is a test response",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it("should render the OutputCard component", () => {
    render(<OutputCard message={mockMessage} />);
    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("should display 'No response data available' when message is null", () => {
    render(<OutputCard message={null} />);
    expect(screen.getByText("No response data available")).toBeInTheDocument();
  });

  it("should display message content when message is present", () => {
    render(<OutputCard message={mockMessage} />);
    expect(screen.getByText("This is a test response")).toBeInTheDocument();
  });

  it("should display ASSISTANT label when message is present", () => {
    render(<OutputCard message={mockMessage} />);
    expect(screen.getByText("ASSISTANT")).toBeInTheDocument();
  });

  it("should display token count when provided", () => {
    render(<OutputCard message={mockMessage} completionTokens={250} />);
    expect(screen.getByText(/Tokens: 250/)).toBeInTheDocument();
  });

  it("should display cost when provided", () => {
    render(<OutputCard message={mockMessage} outputCost={0.0025} />);
    expect(screen.getByText(/Cost: \$0\.002500/)).toBeInTheDocument();
  });

  it("should copy message content when copy button is clicked", async () => {
    render(<OutputCard message={mockMessage} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });

    expect(copyButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("This is a test response");
    });
  });

  it("should not copy when message is null and copy button is clicked", async () => {
    const user = userEvent.setup();

    render(<OutputCard message={null} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });

    expect(copyButton).toBeInTheDocument();
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).not.toHaveBeenCalled();
    });
  });

  it("should toggle collapse state when header is clicked", async () => {
    const user = userEvent.setup();
    render(<OutputCard message={mockMessage} />);

    const header = screen.getByText("Output").closest("div");
    expect(header).toBeInTheDocument();

    const content = screen.getByText("This is a test response");
    expect(content).toBeInTheDocument();
    expect(content).toBeVisible();

    if (header) {
      await user.click(header);
      await waitFor(() => {
        expect(content).not.toBeVisible();
      });
    }
  });

  it("should handle empty content in message", () => {
    const messageWithEmptyContent: ParsedMessage = {
      role: "assistant",
      content: "",
    };
    render(<OutputCard message={messageWithEmptyContent} />);
    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("should handle tool calls in message", () => {
    const messageWithToolCalls: ParsedMessage = {
      role: "assistant",
      content: "I'll call a function",
      toolCalls: [
        {
          id: "call-1",
          name: "get_weather",
          arguments: { location: "San Francisco" },
        },
      ],
    };
    render(<OutputCard message={messageWithToolCalls} />);
    expect(screen.getByText("I'll call a function")).toBeInTheDocument();
  });

  it("should display both token count and cost when both are provided", () => {
    render(<OutputCard message={mockMessage} completionTokens={300} outputCost={0.003} />);
    expect(screen.getByText(/Tokens: 300/)).toBeInTheDocument();
    expect(screen.getByText(/Cost: \$0\.003000/)).toBeInTheDocument();
  });

  it("should handle collapse toggle when message is null", async () => {
    const user = userEvent.setup();
    render(<OutputCard message={null} />);

    const header = screen.getByText("Output").closest("div");
    expect(header).toBeInTheDocument();

    const noDataText = screen.getByText("No response data available");
    expect(noDataText).toBeInTheDocument();
    expect(noDataText).toBeVisible();

    if (header) {
      await user.click(header);
      await waitFor(() => {
        expect(noDataText).not.toBeVisible();
      });
    }
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese empty response state and hides the English one", () => {
      render(<OutputCard message={null} />);

      expect(screen.getByText("没有可用的响应数据")).toBeInTheDocument();
      expect(screen.queryByText("No response data available")).not.toBeInTheDocument();
    });

    it("reports the copy action in Chinese and hides the English one", async () => {
      const user = userEvent.setup();
      render(<OutputCard message={mockMessage} />);

      await user.click(screen.getByRole("button", { name: "复制输出" }));

      expect(toast.success).toHaveBeenCalledWith("已复制输出");
      expect(toast.success).not.toHaveBeenCalledWith("Output copied");
    });
  });
});
