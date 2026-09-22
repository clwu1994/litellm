/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { MemoryRow } from "@/components/networking";

import { MemoryEditModal } from "./MemoryEditModal";

const existingRow: MemoryRow = {
  memory_id: "mem-1",
  key: "user:profile",
  value: "The user prefers concise answers.",
  metadata: { tags: ["example"] },
};

const renderModal = (props: Partial<React.ComponentProps<typeof MemoryEditModal>> = {}) =>
  renderWithProviders(<MemoryEditModal open mode="create" onClose={vi.fn()} onSave={vi.fn()} {...props} />);

const openHint = async (user: ReturnType<typeof userEvent.setup>, label: string): Promise<HTMLElement> => {
  const trigger = screen.getByText(label).closest("label")?.querySelector('[data-slot="tooltip-trigger"]');
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

describe("MemoryEditModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese create title, field labels, placeholders and actions", () => {
    renderModal();

    expect(screen.getByRole("heading", { name: "创建记忆" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create memory" })).not.toBeInTheDocument();

    expect(screen.getByLabelText("键")).toBeInTheDocument();
    expect(screen.getByLabelText("值")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.getByText("（可选 JSON）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Key")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Value")).not.toBeInTheDocument();
    expect(screen.queryByText("Metadata")).not.toBeInTheDocument();
    expect(screen.queryByText("(optional JSON)")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("例如 user_role")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("希望 Agent 记住的内容…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. user_role")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("What the agent should remember…")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
  });

  it("renders each Chinese field hint in its open tooltip and hides the English original", async () => {
    const user = userEvent.setup();
    renderModal();

    const keyHint = await openHint(user, "键");
    expect(keyHint).toHaveTextContent(
      "全局唯一，两个记忆不能共享同一个键。如果需要按用户隔离，请为自己的键加上命名空间（例如 user:123:notes）。",
    );
    expect(keyHint).not.toHaveTextContent(
      "Globally unique — two memories cannot share a key. Namespace your own keys if you need per-user isolation (e.g. user:123:notes).",
    );

    const valueHint = await openHint(user, "值");
    expect(valueHint).toHaveTextContent("注入到 LLM 上下文中的 Markdown/文本。纯字符串即可。");
    expect(valueHint).not.toHaveTextContent("Markdown/text injected into LLM context. Plain strings are fine.");

    const metadataHint = await openHint(user, "元数据");
    expect(metadataHint).toHaveTextContent("可选的结构化元数据，如提供必须是有效的 JSON。");
    expect(metadataHint).not.toHaveTextContent("Optional structured metadata — must be valid JSON if provided.");
  });

  it("renders the Chinese required-field errors and hides the English originals", async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("键"), { target: { value: "user_role" } });
    fireEvent.change(screen.getByLabelText("值"), { target: { value: "Remembers the user is an admin" } });
    expect(screen.queryByText("键为必填项")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("键"), { target: { value: "" } });
    expect(await screen.findByText("键为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Key is required")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("值"), { target: { value: "" } });
    expect(await screen.findByText("值为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Value is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit title and save action", () => {
    renderModal({ mode: "edit", initialRow: existingRow });

    expect(screen.getByRole("heading", { name: "编辑 user:profile" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Edit user:profile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });
});

describe("MemoryEditModal English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByRole("heading", { name: "Create memory" })).toBeInTheDocument();
    expect(screen.getByLabelText("Key")).toBeInTheDocument();
    expect(screen.getByLabelText("Value")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Metadata/)).toBeInTheDocument();
    expect(screen.getByText("(optional JSON)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. user_role")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What the agent should remember…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('{"tags": ["example"]}')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();

    const keyHint = await openHint(user, "Key");
    expect(keyHint).toHaveTextContent(
      "Globally unique — two memories cannot share a key. Namespace your own keys if you need per-user isolation (e.g. user:123:notes).",
    );
    const valueHint = await openHint(user, "Value");
    expect(valueHint).toHaveTextContent("Markdown/text injected into LLM context. Plain strings are fine.");
    const metadataHint = await openHint(user, "Metadata");
    expect(metadataHint).toHaveTextContent("Optional structured metadata — must be valid JSON if provided.");
  });

  it("keeps the original English edit title, validation errors and save action byte-identical", async () => {
    renderModal({ mode: "edit", initialRow: existingRow });

    expect(screen.getByRole("heading", { name: "Edit user:profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } });
    expect(await screen.findByText("Value is required")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Key"), { target: { value: "" } });
    expect(await screen.findByText("Key is required")).toBeInTheDocument();
  });
});
