import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { setCallbacksCall } from "./networking";
import ModelGroupAliasSettings from "./model_group_alias_settings";

vi.mock("./networking", () => ({
  setCallbacksCall: vi.fn(),
}));

const renderSettings = (initialModelGroupAlias: Record<string, string> = {}) =>
  render(<ModelGroupAliasSettings accessToken="sk-test" initialModelGroupAlias={initialModelGroupAlias} />);

describe("ModelGroupAliasSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(setCallbacksCall).mockResolvedValue(undefined as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese chrome, field labels and empty state", () => {
    renderSettings();

    expect(screen.getByText("模型组别名设置")).toBeInTheDocument();
    expect(screen.queryByText("Model Group Alias Settings")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "为模型组创建别名以简化 API 调用。例如，你可以创建一个指向 'gpt-4o-mini-openai' 模型组的 'gpt-4o' 别名。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("添加新别名")).toBeInTheDocument();
    expect(screen.getAllByText("别名").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("目标模型组").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByPlaceholderText("例如 gpt-4o")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 gpt-4o-mini-openai")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加别名" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Alias" })).not.toBeInTheDocument();
    expect(screen.getByText("管理现有别名")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.getByText("尚未添加任何别名。请在上方添加新别名。")).toBeInTheDocument();
    expect(screen.getByText("配置示例")).toBeInTheDocument();
    expect(screen.queryByText("Configuration Example")).not.toBeInTheDocument();
    expect(screen.getByText("以下是当前别名在 config.yaml 中的样子：")).toBeInTheDocument();
  });

  it("renders the Chinese config example for an existing alias", () => {
    renderSettings({ "gpt-4o": "gpt-4o-mini-openai" });

    expect(screen.getByText("以下是当前别名在 config.yaml 中的样子：")).toBeInTheDocument();
    expect(screen.getByText('"gpt-4o": "gpt-4o-mini-openai"')).toBeInTheDocument();
  });

  it("adds an alias and reports success in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByPlaceholderText("例如 gpt-4o"), "fast");
    await user.type(screen.getByPlaceholderText("例如 gpt-4o-mini-openai"), "gpt-4o-mini");
    await user.click(screen.getByRole("button", { name: "添加别名" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("别名添加成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Alias added successfully");
  });

  it("rejects a duplicate alias in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings({ "gpt-4o": "gpt-4o-mini-openai" });

    await user.type(screen.getByPlaceholderText("例如 gpt-4o"), "gpt-4o");
    await user.type(screen.getByPlaceholderText("例如 gpt-4o-mini-openai"), "other");
    await user.click(screen.getByRole("button", { name: "添加别名" }));

    expect(toast.fromError).toHaveBeenCalledWith("已存在使用此名称的别名");
    expect(setCallbacksCall).not.toHaveBeenCalled();
  });

  it("reports a failed save in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(setCallbacksCall).mockRejectedValue(new Error("boom"));
    renderSettings();

    await user.type(screen.getByPlaceholderText("例如 gpt-4o"), "fast");
    await user.type(screen.getByPlaceholderText("例如 gpt-4o-mini-openai"), "gpt-4o-mini");
    await user.click(screen.getByRole("button", { name: "添加别名" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存模型组别名设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save model group alias settings");
  });

  it("updates an alias and reports success in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings({ "gpt-4o": "gpt-4o-mini-openai" });

    const row = screen.getByRole("row", { name: /gpt-4o/ });
    await user.click(within(row).getAllByRole("button")[0]);
    fireEvent.change(within(row).getAllByRole("textbox")[1], { target: { value: "gpt-4o-mini" } });
    await user.click(within(row).getByRole("button", { name: "保存" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("别名更新成功"));
  });

  it("rejects an update with a missing field in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings({ "gpt-4o": "gpt-4o-mini-openai" });

    const row = screen.getByRole("row", { name: /gpt-4o/ });
    await user.click(within(row).getAllByRole("button")[0]);
    fireEvent.change(within(row).getAllByRole("textbox")[0], { target: { value: "" } });
    await user.click(within(row).getByRole("button", { name: "保存" }));

    expect(toast.fromError).toHaveBeenCalledWith("请同时提供别名和目标模型组");
    expect(setCallbacksCall).not.toHaveBeenCalled();
  });

  it("deletes an alias and reports success in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings({ "gpt-4o": "gpt-4o-mini-openai" });

    const row = screen.getByRole("row", { name: /gpt-4o/ });
    await user.click(within(row).getAllByRole("button")[1]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("别名删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Alias deleted successfully");
  });
});
