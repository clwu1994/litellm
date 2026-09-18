import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { renderWithProviders } from "../../../tests/test-utils";
import EditMembership from "./EditMembership";

describe("EditMembership", () => {
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultConfig = {
    title: "Add Member",
    roleOptions: [
      { label: "Admin", value: "admin" },
      { label: "Member", value: "member" },
    ],
    defaultRole: "member",
    showEmail: true,
    showUserId: false,
  };

  it("should render", () => {
    renderWithProviders(
      <EditMembership
        visible={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        mode="add"
        config={defaultConfig}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
  });

  it("should submit form data when adding a member", async () => {
    renderWithProviders(
      <EditMembership
        visible={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        mode="add"
        config={defaultConfig}
      />,
    );

    const emailInput = screen.getByPlaceholderText("user@example.com");
    const submitButton = screen.getByRole("button", { name: "Add Member" });

    act(() => {
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });

    await waitFor(() => {
      expect(emailInput).toHaveValue("test@example.com");
    });

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          user_email: "test@example.com",
          role: "member",
        }),
      );
    });
  });
});

describe("EditMembership localization", () => {
  const config = {
    title: "Add Member",
    roleOptions: [
      { label: "Admin", value: "admin" },
      { label: "Member", value: "member" },
    ],
    defaultRole: "member",
    showEmail: true,
    showUserId: false,
  };

  const renderModal = () =>
    renderWithProviders(
      <EditMembership visible={true} onCancel={vi.fn()} onSubmit={vi.fn()} mode="add" config={config} />,
    );

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese member form labels under zh", async () => {
    await i18n.changeLanguage("zh");
    renderModal();

    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("角色")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加成员" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the English member form labels under en", async () => {
    await i18n.changeLanguage("en");
    renderModal();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Member" })).toBeInTheDocument();

    expect(screen.queryByLabelText("邮箱")).not.toBeInTheDocument();
  });
});
