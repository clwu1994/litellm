import { afterEach, describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";

import { act, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import PageVisibilitySettings from "./PageVisibilitySettings";

vi.mock("@/components/page_utils", () => ({
  getAvailablePages: (t: TFunction<"nav">) => [
    {
      page: "usage",
      label: t("items.usage"),
      descriptionKey: "descriptions.usage",
      group: "OBSERVABILITY",
      groupKey: "section.observability",
    },
    {
      page: "models",
      label: t("items.modelsAndEndpoints"),
      descriptionKey: "descriptions.models",
      group: "OBSERVABILITY",
      groupKey: "section.observability",
    },
    {
      page: "keys",
      label: t("items.keys"),
      descriptionKey: "descriptions.apiKeys",
      group: "ACCESS CONTROL",
      groupKey: "section.accessControl",
    },
  ],
}));

describe("PageVisibilitySettings", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("should render the not-set tag when enabledPagesInternalUsers is null", () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expect(screen.getByText("Not set (all pages visible)")).toBeInTheDocument();
  });

  it("should show the selected page count tag when pages are configured", () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage", "keys"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expect(screen.getByText("2 pages selected")).toBeInTheDocument();
  });

  it("should show singular 'page' when exactly one page is selected", () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expect(screen.getByText("1 page selected")).toBeInTheDocument();
  });

  it("should call onUpdate with null when reset button is clicked", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={onUpdate} />,
    );

    // Expand the collapse panel first to reveal the reset button
    await user.click(screen.getByRole("button", { name: /configure page visibility/i }));
    await user.click(await screen.findByRole("button", { name: /reset to default/i }));

    expect(onUpdate).toHaveBeenCalledWith({ enabled_ui_pages_internal_users: null });
  });

  it("should render every page under its original group when Object.groupBy is unavailable", async () => {
    const groupByDescriptor = Object.getOwnPropertyDescriptor(Object, "groupBy");
    Object.defineProperty(Object, "groupBy", { configurable: true, value: undefined });

    try {
      const user = userEvent.setup();
      renderWithProviders(
        <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
      );

      await user.click(screen.getByRole("button", { name: /configure page visibility/i }));

      expect(screen.getByRole("group", { name: "OBSERVABILITY" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "ACCESS CONTROL" })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /usage/i })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /models/i })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /virtual keys/i })).toBeInTheDocument();
    } finally {
      if (groupByDescriptor) {
        Object.defineProperty(Object, "groupBy", groupByDescriptor);
      } else {
        Reflect.deleteProperty(Object, "groupBy");
      }
    }
  });

  it("should display the property description when provided", () => {
    renderWithProviders(
      <PageVisibilitySettings
        enabledPagesInternalUsers={null}
        enabledPagesPropertyDescription="Controls which pages are visible"
        isUpdating={false}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText("Controls which pages are visible")).toBeInTheDocument();
  });

  it("relabels the pages and group headings on a language change without navigating", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /configure page visibility/i }));
    expect(screen.getByRole("group", { name: "OBSERVABILITY" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /usage/i })).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    expect(screen.getByRole("group", { name: "可观测性" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /用量/ })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "OBSERVABILITY" })).not.toBeInTheDocument();
  });

  it("renders the page descriptions in Chinese and hides the English originals", async () => {
    await i18n.changeLanguage("zh");
    const user = userEvent.setup();
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "配置页面可见性" }));

    for (const [zh, en] of [
      ["查看旧版用量仪表盘", "View legacy usage dashboard"],
      ["配置和管理 LLM 模型与 Endpoints", "Configure and manage LLM models and endpoints"],
      ["管理用于 API 访问和身份验证的 Virtual Key", "Manage virtual keys for API access and authentication"],
    ] as const) {
      expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(en)).toHaveLength(0);
    }
  });
});
