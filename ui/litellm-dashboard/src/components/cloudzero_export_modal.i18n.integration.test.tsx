import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import CloudZeroExportModal from "./cloudzero_export_modal";

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/networking", () => ({
  getGlobalLitellmHeaderName: () => "Authorization",
}));

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const open = (accessToken: string | null = "sk-test") =>
  renderWithProviders(<CloudZeroExportModal isOpen onClose={vi.fn()} accessToken={accessToken} />);

describe("CloudZeroExportModal Chinese copy", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url === "/cloudzero/settings") return jsonResponse(404, { error: "not configured" });
      if (url === "/cloudzero/init") return jsonResponse(200, {});
      if (url === "/cloudzero/export") return jsonResponse(200, {});
      return jsonResponse(500, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog chrome and form in Chinese", async () => {
    open();

    expect(await screen.findByText("导出数据")).toBeInTheDocument();
    expect(screen.queryByText("Export Data")).not.toBeInTheDocument();
    expect(screen.getByText("导出目标")).toBeInTheDocument();
    expect(screen.queryByText("Export Destination")).not.toBeInTheDocument();
    expect(screen.getByLabelText("连接 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Connection ID")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 CloudZero API Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your CloudZero API key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 CloudZero 连接 ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出到 CloudZero" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export to CloudZero" })).not.toBeInTheDocument();
  });

  it("renders the destination options in Chinese", async () => {
    const user = userEvent.setup();
    open();

    await screen.findByLabelText("CloudZero API Key");
    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "导出到 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Export to CSV" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Export to CloudZero" })).not.toBeInTheDocument();
  });

  it("renders the required-field messages in Chinese", async () => {
    const user = userEvent.setup();
    open();

    await screen.findByLabelText("CloudZero API Key");
    await user.click(screen.getByRole("button", { name: "导出到 CloudZero" }));

    expect(await screen.findByText("请输入你的 CloudZero API Key")).toBeInTheDocument();
    expect(screen.queryByText("Please enter your CloudZero API key")).not.toBeInTheDocument();
    expect(screen.getByText("请输入 CloudZero 连接 ID")).toBeInTheDocument();
    expect(screen.queryByText("Please enter the CloudZero connection ID")).not.toBeInTheDocument();
  });

  it("renders the CSV destination copy in Chinese", async () => {
    const user = userEvent.setup();
    open();

    await screen.findByLabelText("CloudZero API Key");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "导出到 CSV" }));

    expect(await screen.findByText("CSV 导出")).toBeInTheDocument();
    expect(screen.queryByText("CSV Export")).not.toBeInTheDocument();
    expect(screen.getByText("将使用数据导出为 CSV 文件，以便在电子表格应用中分析。")).toBeInTheDocument();
    expect(
      screen.queryByText("Export your usage data as a CSV file for analysis in spreadsheet applications."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(toast.info).toHaveBeenCalledWith("CSV 导出功能即将推出！");
    expect(toast.info).not.toHaveBeenCalledWith("CSV export functionality coming soon!");
  });

  it("reports a CSV export failure in Chinese when the info toast throws", async () => {
    vi.mocked(toast.info).mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const user = userEvent.setup();
    open();

    await screen.findByLabelText("CloudZero API Key");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "导出到 CSV" }));
    await user.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(toast.fromError).toHaveBeenCalledWith("导出 CSV 失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to export CSV");
  });

  it("renders the existing configuration alert in Chinese", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/cloudzero/settings")
        return jsonResponse(200, {
          api_key_masked: "cz-1****4567",
          connection_id: "conn-existing",
          status: "configured",
        });
      return jsonResponse(500, {});
    });
    open();

    expect(await screen.findByText("现有 CloudZero 配置")).toBeInTheDocument();
    expect(screen.queryByText("Existing CloudZero Configuration")).not.toBeInTheDocument();
    const alert = screen.getByText(/cz-1\*\*\*\*4567/);
    expect(alert).toHaveTextContent("API Key：cz-1****4567");
    expect(alert).toHaveTextContent("连接 ID：conn-existing");
    expect(alert).not.toHaveTextContent("API Key: cz-1****4567");
    expect(alert).not.toHaveTextContent("Connection ID: conn-existing");
  });

  it("reports a settings load failure in Chinese", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/cloudzero/settings") return jsonResponse(500, { error: "boom" });
      return jsonResponse(500, {});
    });
    open();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载现有设置失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load existing settings: boom");
  });

  it("reports a missing access token in Chinese", async () => {
    const user = userEvent.setup();
    open(null);

    fireEvent.change(await screen.findByLabelText("CloudZero API Key"), { target: { value: "cz-key-123" } });
    fireEvent.change(screen.getByLabelText("连接 ID"), { target: { value: "conn-abc" } });
    await user.click(screen.getByRole("button", { name: "导出到 CloudZero" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("没有可用的访问 Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("No access token available");
  });

  it("reports a successful save and export in Chinese", async () => {
    const user = userEvent.setup();
    open();

    fireEvent.change(await screen.findByLabelText("CloudZero API Key"), { target: { value: "cz-key-123" } });
    fireEvent.change(screen.getByLabelText("连接 ID"), { target: { value: "conn-abc" } });
    await user.click(screen.getByRole("button", { name: "导出到 CloudZero" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("CloudZero 设置保存成功"));
    expect(toast.success).toHaveBeenCalledWith("导出到 CloudZero 已完成");
    expect(toast.success).not.toHaveBeenCalledWith("CloudZero settings saved successfully");
  });

  it("reports a failed save in Chinese", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/cloudzero/settings") return jsonResponse(404, { error: "not configured" });
      if (url === "/cloudzero/init") return jsonResponse(400, {});
      return jsonResponse(500, {});
    });
    const user = userEvent.setup();
    open();

    fireEvent.change(await screen.findByLabelText("CloudZero API Key"), { target: { value: "cz-key-123" } });
    fireEvent.change(screen.getByLabelText("连接 ID"), { target: { value: "conn-abc" } });
    await user.click(screen.getByRole("button", { name: "导出到 CloudZero" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存 CloudZero 设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save CloudZero settings");
  });

  it("reports a failed export in Chinese", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/cloudzero/settings") return jsonResponse(200, { api_key_masked: "cz-****", connection_id: "c1" });
      if (url === "/cloudzero/export") return jsonResponse(400, {});
      return jsonResponse(500, {});
    });
    const user = userEvent.setup();
    open();

    await screen.findByText("现有 CloudZero 配置");
    await user.click(screen.getByRole("button", { name: "导出到 CloudZero" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("导出到 CloudZero 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to export to CloudZero");
  });
});
