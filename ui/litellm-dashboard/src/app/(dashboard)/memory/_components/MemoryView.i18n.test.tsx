import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  testQueryClient,
  waitFor,
  within,
} from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { MemoryRow } from "@/components/networking";
import { toast } from "@/lib/toast";

import { MemoryView } from "./MemoryView";

interface CapturedTableProps {
  data: MemoryRow[];
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

const captured = vi.hoisted(() => ({ current: null as CapturedTableProps | null }));
const fetchMemoryListMock = vi.hoisted(() => vi.fn());
const createMemoryMock = vi.hoisted(() => vi.fn());
const updateMemoryMock = vi.hoisted(() => vi.fn());
const deleteMemoryMock = vi.hoisted(() => vi.fn());

vi.mock("./MemoryTable", () => ({
  MemoryTable: function MemoryTableMock(props: CapturedTableProps) {
    captured.current = props;
    return <div data-testid="memory-table-mock" />;
  },
}));

vi.mock("@/components/networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/networking")>()),
  fetchMemoryList: fetchMemoryListMock,
  createMemory: createMemoryMock,
  updateMemory: updateMemoryMock,
  deleteMemory: deleteMemoryMock,
}));

vi.mock("@tanstack/react-pacer/debouncer", () => ({
  useDebouncedValue: (value: unknown) => [value, { cancel: vi.fn(), flush: vi.fn() }],
}));

const makeMemory = (overrides: Partial<MemoryRow> = {}): MemoryRow => ({
  memory_id: "mem-1",
  key: "user:profile",
  value: "The user prefers concise answers.",
  metadata: null,
  user_id: "user-42",
  team_id: "team-7",
  ...overrides,
});

const renderView = () => renderWithProviders(<MemoryView accessToken="token" userID={null} userRole={null} />);

const openCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /新建记忆|New memory/ }));
};

describe("MemoryView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    fetchMemoryListMock.mockResolvedValue({ memories: [], total: 0 });
    createMemoryMock.mockResolvedValue(makeMemory({ memory_id: "mem-new", key: "user:role" }));
    updateMemoryMock.mockResolvedValue(makeMemory());
    deleteMemoryMock.mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, scope note and create action and hides the English originals", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "记忆" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Memory" })).not.toBeInTheDocument();

    const description = screen.getByRole("paragraph");
    expect(description).toHaveTextContent(
      "查看你的 Agent 在 /v1/memory 下存储的内容。范围限定为对你的用户 / 团队可见的记忆（管理员可见全部）。",
    );
    expect(description).not.toHaveTextContent(
      "Inspect what your agents have stored under /v1/memory. Scoped to memories visible to your user / team (admins see all).",
    );

    expect(screen.getByRole("button", { name: "新建记忆" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New memory" })).not.toBeInTheDocument();
  });

  it("renders the Chinese delete confirmation in its open dialog and hides the English originals", async () => {
    renderView();
    await waitFor(() => expect(captured.current).not.toBeNull());

    act(() => captured.current?.onDeleteClick(makeMemory()));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("删除记忆")).toBeInTheDocument();
    expect(within(dialog).getByText("此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).getByText("记忆")).toBeInTheDocument();
    expect(within(dialog).getByText("键")).toBeInTheDocument();
    expect(within(dialog).getByText("记忆 ID")).toBeInTheDocument();
    expect(within(dialog).getByText("用户 ID")).toBeInTheDocument();
    expect(within(dialog).getByText("团队 ID")).toBeInTheDocument();

    expect(within(dialog).queryByText("Delete memory")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("This action cannot be undone.")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Memory")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Key")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Memory ID")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("User ID")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Team ID")).not.toBeInTheDocument();
  });

  it("reports a successful create in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderView();

    await openCreateForm(user);
    fireEvent.change(screen.getByLabelText(/^键/), { target: { value: "user:role" } });
    fireEvent.change(screen.getByLabelText(/^值/), { target: { value: "admin" } });
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已创建 user:role"));
    expect(toast.success).not.toHaveBeenCalledWith("Created user:role");
  });

  it("reports a successful update in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(captured.current).not.toBeNull());

    act(() => captured.current?.onEditClick(makeMemory()));
    await user.click(await screen.findByRole("button", { name: "保存" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已更新 user:profile"));
    expect(toast.success).not.toHaveBeenCalledWith("Updated user:profile");
  });

  it("reports a successful delete in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(captured.current).not.toBeNull());

    act(() => captured.current?.onDeleteClick(makeMemory()));
    fireEvent.change(screen.getByPlaceholderText("user:profile"), { target: { value: "user:profile" } });
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已删除 user:profile"));
    expect(toast.success).not.toHaveBeenCalledWith("Deleted user:profile");
  });

  it("reports a failed save in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    createMemoryMock.mockRejectedValue(new Error("boom"));
    renderView();

    await openCreateForm(user);
    fireEvent.change(screen.getByLabelText(/^键/), { target: { value: "user:role" } });
    fireEvent.change(screen.getByLabelText(/^值/), { target: { value: "admin" } });
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("保存失败：boom"));
    expect(toast.error).not.toHaveBeenCalledWith("Save failed: boom");
  });

  it("reports a failed delete in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    deleteMemoryMock.mockRejectedValue(new Error("boom"));
    renderView();
    await waitFor(() => expect(captured.current).not.toBeNull());

    act(() => captured.current?.onDeleteClick(makeMemory()));
    fireEvent.change(screen.getByPlaceholderText("user:profile"), { target: { value: "user:profile" } });
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("删除失败：boom"));
    expect(toast.error).not.toHaveBeenCalledWith("Delete failed: boom");
  });

  it("reports invalid metadata in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderView();

    await openCreateForm(user);
    fireEvent.change(screen.getByLabelText(/^键/), { target: { value: "user:role" } });
    fireEvent.change(screen.getByLabelText(/^值/), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^元数据/), { target: { value: "not json" } });
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("元数据必须是有效的 JSON（或留空）。"));
    expect(toast.error).not.toHaveBeenCalledWith("Metadata must be valid JSON (or leave empty).");
    expect(createMemoryMock).not.toHaveBeenCalled();
  });
});

describe("MemoryView English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    fetchMemoryListMock.mockResolvedValue({ memories: [], total: 0 });
    createMemoryMock.mockResolvedValue(makeMemory({ memory_id: "mem-new", key: "user:role" }));
    updateMemoryMock.mockResolvedValue(makeMemory());
    deleteMemoryMock.mockResolvedValue(undefined);
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const user = userEvent.setup();
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Memory" })).toBeInTheDocument();
    const description = screen.getByRole("paragraph");
    expect(description).toHaveTextContent(
      "Inspect what your agents have stored under /v1/memory. Scoped to memories visible to your user / team (admins see all).",
    );
    expect(screen.getByRole("button", { name: "New memory" })).toBeInTheDocument();

    await openCreateForm(user);
    fireEvent.change(screen.getByLabelText(/^Key/), { target: { value: "user:role" } });
    fireEvent.change(screen.getByLabelText(/^Value/), { target: { value: "admin" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Created user:role"));

    await waitFor(() => expect(captured.current).not.toBeNull());
    act(() => captured.current?.onEditClick(makeMemory()));
    await user.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Updated user:profile"));

    act(() => captured.current?.onDeleteClick(makeMemory()));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Delete memory")).toBeInTheDocument();
    expect(within(dialog).getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(within(dialog).getByText("Memory")).toBeInTheDocument();
    expect(within(dialog).getByText("Key")).toBeInTheDocument();
    expect(within(dialog).getByText("Memory ID")).toBeInTheDocument();
    expect(within(dialog).getByText("User ID")).toBeInTheDocument();
    expect(within(dialog).getByText("Team ID")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("user:profile"), { target: { value: "user:profile" } });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Deleted user:profile"));
  });
});
