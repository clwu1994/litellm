import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import OrganizationFilters, { FilterState } from "./OrganizationFilters";

describe("OrganizationFilters", () => {
  const defaultFilters: FilterState = {
    org_id: "",
    org_alias: "",
  };

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("should render", () => {
    const onToggleFilters = vi.fn();
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={false}
        onToggleFilters={onToggleFilters}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    expect(screen.getByPlaceholderText("Search by Organization Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^filters$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
  });

  it("should show additional filters when showFilters is true", () => {
    const onToggleFilters = vi.fn();
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={true}
        onToggleFilters={onToggleFilters}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    expect(screen.getByPlaceholderText("Search by Organization ID")).toBeInTheDocument();
  });

  it("should call onChange when organization name input changes", async () => {
    const user = userEvent.setup();
    const onToggleFilters = vi.fn();
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={false}
        onToggleFilters={onToggleFilters}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    const input = screen.getByPlaceholderText("Search by Organization Name");
    fireEvent.change(input, { target: { value: "test" } });

    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledWith("org_alias", expect.any(String));
      },
      { timeout: 500 },
    );
  });

  it("should call onReset when reset button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleFilters = vi.fn();
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={false}
        onToggleFilters={onToggleFilters}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    const resetButton = screen.getByRole("button", { name: /reset filters/i });
    await user.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("should show badge on filters button when filters are active", () => {
    const onToggleFilters = vi.fn();
    const onChange = vi.fn();
    const onReset = vi.fn();

    const filtersWithActive: FilterState = {
      ...defaultFilters,
      org_alias: "test org",
    };

    const { container } = render(
      <OrganizationFilters
        filters={filtersWithActive}
        showFilters={false}
        onToggleFilters={onToggleFilters}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    expect(screen.getByRole("button", { name: /^filters$/i })).toBeInTheDocument();
    expect(container.querySelector("sup")).toBeInTheDocument();
  });

  it("renders the Chinese filter placeholders under zh and the English under en", async () => {
    await i18n.changeLanguage("zh");
    const { unmount } = render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={true}
        onToggleFilters={vi.fn()}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("按组织名称搜索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按组织 ID 搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by Organization Name")).not.toBeInTheDocument();

    unmount();
    await i18n.changeLanguage("en");
    render(
      <OrganizationFilters
        filters={defaultFilters}
        showFilters={true}
        onToggleFilters={vi.fn()}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Search by Organization Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by Organization ID")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("按组织名称搜索")).not.toBeInTheDocument();
  });
});
