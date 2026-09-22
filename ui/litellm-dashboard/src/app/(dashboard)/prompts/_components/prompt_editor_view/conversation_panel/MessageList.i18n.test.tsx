import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import MessageList from "./MessageList";

describe("MessageList Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading label and hides the English original", () => {
    renderWithProviders(
      <MessageList messages={[]} isLoading hasVariables={false} messagesEndRef={createRef<HTMLDivElement>()} />,
    );

    expect(screen.getByLabelText("正在加载回复")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading response")).not.toBeInTheDocument();
  });
});
