import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import DeleteResourceModal from "./DeleteResourceModal";

const defaultProps = {
  isOpen: true,
  title: "Delete Resource",
  message: "Are you sure you want to delete this resource?",
  onCancel: vi.fn(),
  onOk: vi.fn(),
  confirmLoading: false,
};

describe("DeleteResourceModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese confirmation prompt and hides the English original", () => {
    renderWithProviders(<DeleteResourceModal {...defaultProps} requiredConfirmation="DELETE" />);

    expect(screen.getByText(/以确认删除/)).toHaveTextContent("输入 DELETE 以确认删除：");
    expect(screen.queryByText(/Type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/to confirm deletion/i)).not.toBeInTheDocument();
  });

  it("renders the Chinese cancel and delete labels and hides the English originals", () => {
    renderWithProviders(<DeleteResourceModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders the Chinese deleting label and hides the English original", () => {
    renderWithProviders(<DeleteResourceModal {...defaultProps} confirmLoading />);

    expect(screen.getByRole("button", { name: "删除中..." })).toBeInTheDocument();
    expect(screen.queryByText("Deleting...")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
