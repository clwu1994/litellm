import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders the input label with token, cost and turn metrics", () => {
    render(<SectionHeader type="input" tokens={1234} cost={0.000123} turnCount={3} onCopy={vi.fn()} />);

    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("Tokens: 1,234")).toBeInTheDocument();
    expect(screen.getByText("Cost: $0.000123")).toBeInTheDocument();
    expect(screen.getByText("Turns: 3")).toBeInTheDocument();
  });

  it("renders the output label", () => {
    render(<SectionHeader type="output" onCopy={vi.fn()} />);

    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("omits metrics that were not provided", () => {
    render(<SectionHeader type="input" onCopy={vi.fn()} />);

    expect(screen.queryByText(/^Tokens:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Cost:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Turns:/)).not.toBeInTheDocument();
  });

  it("omits the turn count when there are no turns", () => {
    render(<SectionHeader type="input" turnCount={0} onCopy={vi.fn()} />);

    expect(screen.queryByText(/^Turns:/)).not.toBeInTheDocument();
  });

  it("copies without toggling the section", async () => {
    const onCopy = vi.fn();
    const onToggleCollapse = vi.fn();
    render(<SectionHeader type="input" onCopy={onCopy} onToggleCollapse={onToggleCollapse} />);

    await userEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onToggleCollapse).not.toHaveBeenCalled();
  });

  it("toggles the section when the header is clicked", async () => {
    const onToggleCollapse = vi.fn();
    render(<SectionHeader type="input" onCopy={vi.fn()} onToggleCollapse={onToggleCollapse} />);

    await userEvent.click(screen.getByText("Input"));

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("reports its collapsed state to assistive technology", () => {
    const { rerender } = render(
      <SectionHeader type="input" onCopy={vi.fn()} onToggleCollapse={vi.fn()} isCollapsed={false} />,
    );

    expect(screen.getByRole("button", { name: /^Input/ })).toHaveAttribute("aria-expanded", "true");

    rerender(<SectionHeader type="input" onCopy={vi.fn()} onToggleCollapse={vi.fn()} isCollapsed={true} />);

    expect(screen.getByRole("button", { name: /^Input/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("names each copy button for the section it belongs to", () => {
    render(<SectionHeader type="output" onCopy={vi.fn()} onToggleCollapse={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Copy output" })).toBeInTheDocument();
  });

  it("stays inert when no toggle handler is given", async () => {
    const onCopy = vi.fn();
    render(<SectionHeader type="input" onCopy={onCopy} />);

    await userEvent.click(screen.getByText("Input"));

    expect(onCopy).not.toHaveBeenCalled();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese input label with token, cost and turn metrics", () => {
      render(<SectionHeader type="input" tokens={1234} cost={0.000123} turnCount={3} onCopy={vi.fn()} />);

      expect(screen.getByText("输入")).toBeInTheDocument();
      expect(screen.getByText("Token：1,234")).toBeInTheDocument();
      expect(screen.getByText("成本：$0.000123")).toBeInTheDocument();
      expect(screen.getByText("轮次：3")).toBeInTheDocument();
      expect(screen.queryByText("Input")).not.toBeInTheDocument();
      expect(screen.queryByText("Tokens: 1,234")).not.toBeInTheDocument();
    });

    it("renders the Chinese output label and copy label and hides the English ones", () => {
      render(<SectionHeader type="output" onCopy={vi.fn()} onToggleCollapse={vi.fn()} />);

      expect(screen.getByText("输出")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "复制输出" })).toBeInTheDocument();
      expect(screen.queryByText("Output")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Copy output" })).not.toBeInTheDocument();
    });

    it("renders the Chinese input copy label", () => {
      render(<SectionHeader type="input" onCopy={vi.fn()} />);

      expect(screen.getByRole("button", { name: "复制输入" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Copy input" })).not.toBeInTheDocument();
    });
  });
});
