import { cleanup, renderWithProviders, screen } from "../../../../tests/test-utils";
import { NotificationsBell, AUTO_ROUTER_DOCS_URL } from "./NotificationsBell";
import i18n from "@/i18n/bootstrapI18n";
import React from "react";
import userEvent from "@testing-library/user-event";

describe("NotificationsBell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should open notifications with Auto Router details and docs link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    expect(screen.getByText(/^LiteLLM Auto Router$/i)).toBeInTheDocument();
    const docsBtn = screen.getByRole("link", { name: /^read the docs$/i });
    expect(docsBtn).toHaveAttribute("href", AUTO_ROUTER_DOCS_URL);
    expect(docsBtn).toHaveAttribute("target", "_blank");
    expect(docsBtn).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should offer mark as read when announcement is unread", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    expect(screen.getByRole("button", { name: /^mark as read$/i })).toBeInTheDocument();
  });

  it("should hide mark as read and persist after marking read", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    await user.click(screen.getByRole("button", { name: /^mark as read$/i }));
    expect(localStorage.getItem("litellmHideAutoRouterAnnouncement")).toBe("true");
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    expect(screen.queryByRole("button", { name: /^mark as read$/i })).not.toBeInTheDocument();
  });

  it("should not show mark as read when previously dismissed", async () => {
    localStorage.setItem("litellmHideAutoRouterAnnouncement", "true");
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    expect(screen.queryByRole("button", { name: /^mark as read$/i })).not.toBeInTheDocument();
  });

  it("should sync sibling instances when one is dismissed", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <div data-testid="bell-a">
          <NotificationsBell />
        </div>
        <div data-testid="bell-b">
          <NotificationsBell />
        </div>
      </>,
    );

    // Both bells start unread → both render the "Mark as read" affordance once opened.
    const [bellA, bellB] = screen.getAllByRole("button", { name: /^notifications$/i });
    await user.click(bellA);
    await user.click(screen.getByRole("button", { name: /^mark as read$/i }));

    // Dismissing in bell A must also clear bell B without a remount.
    await user.click(bellB);
    expect(screen.queryByRole("button", { name: /^mark as read$/i })).not.toBeInTheDocument();
  });
});

describe("NotificationsBell localization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the announcement in Chinese and hides its English originals under zh", async () => {
    await i18n.changeLanguage("zh");
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);

    await user.click(screen.getByRole("button", { name: "通知" }));

    expect(screen.getByText("LiteLLM 自动路由")).toBeInTheDocument();
    expect(screen.getByText("将每个请求路由到能够处理它的最便宜模型，无需修改提示词。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "阅读文档" })).toHaveAttribute("href", AUTO_ROUTER_DOCS_URL);
    expect(screen.getByRole("button", { name: "标记为已读" })).toBeInTheDocument();

    expect(screen.queryByText("LiteLLM Auto Router")).not.toBeInTheDocument();
    expect(screen.queryByText("Read the docs")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^notifications$/i })).not.toBeInTheDocument();
  });

  it("renders the announcement in English under en", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBell />);

    await user.click(screen.getByRole("button", { name: /^notifications$/i }));

    expect(screen.getByText("LiteLLM Auto Router")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM 自动路由")).not.toBeInTheDocument();
  });
});
