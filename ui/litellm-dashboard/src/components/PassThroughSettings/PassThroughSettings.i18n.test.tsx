import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { deletePassThroughEndpointsCall, getPassThroughEndpointsCall } from "../networking";
import PassThroughSettings from "./PassThroughSettings";

vi.mock("../networking", () => ({
  getPassThroughEndpointsCall: vi.fn(),
  deletePassThroughEndpointsCall: vi.fn(),
}));

vi.mock("../add_pass_through", () => ({
  default: () => <div data-testid="add-pass-through" />,
}));

vi.mock("../pass_through_info", () => ({
  default: ({ endpointData }: { endpointData: { id?: string } }) => (
    <div data-testid="endpoint-info">{endpointData.id}</div>
  ),
}));

vi.mock("./PassThroughEndpointsTable", () => ({
  PassThroughEndpointsTable: (props: {
    endpoints: { id?: string }[];
    onEndpointClick: (id: string) => void;
    onDeleteClick: (id: string) => void;
  }) => (
    <div data-testid="endpoints-table">
      {props.endpoints.map((endpoint) => (
        <div key={endpoint.id}>
          <button type="button" onClick={() => endpoint.id && props.onEndpointClick(endpoint.id)}>
            open-{endpoint.id}
          </button>
          <button type="button" onClick={() => endpoint.id && props.onDeleteClick(endpoint.id)}>
            delete-{endpoint.id}
          </button>
        </div>
      ))}
      <button type="button" onClick={() => props.onEndpointClick("missing")}>
        open-missing
      </button>
    </div>
  ),
}));

const defaultProps = {
  accessToken: "token",
  userRole: "Admin",
  userID: "user-1",
  premiumUser: false,
};

const endpoint = { id: "ep-1", path: "/v1/rerank", target: "https://example.com", headers: {} };

describe("PassThroughSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getPassThroughEndpointsCall).mockResolvedValue({ endpoints: [endpoint] } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and description", async () => {
    render(<PassThroughSettings {...defaultProps} />);

    expect(await screen.findByText("透传 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Pass Through Endpoints")).not.toBeInTheDocument();
    expect(screen.getByText("配置和管理你的透传 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Configure and manage your pass-through endpoints")).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found message", async () => {
    const user = userEvent.setup();
    render(<PassThroughSettings {...defaultProps} />);

    await user.click(await screen.findByText("open-missing"));

    expect(screen.getByText("未找到 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Endpoint not found")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete confirmation", async () => {
    const user = userEvent.setup();
    render(<PassThroughSettings {...defaultProps} />);

    await user.click(await screen.findByText("delete-ep-1"));

    expect(screen.getByText("删除透传 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Delete Pass-Through Endpoint")).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此透传 Endpoint 吗？此操作无法撤销。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(deletePassThroughEndpointsCall).not.toHaveBeenCalled();
  });

  it("reports a deleted endpoint in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(deletePassThroughEndpointsCall).mockResolvedValue(undefined as never);
    render(<PassThroughSettings {...defaultProps} />);

    await user.click(await screen.findByText("delete-ep-1"));
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Endpoint 已成功删除。"));
    expect(toast.success).not.toHaveBeenCalledWith("Endpoint deleted successfully.");
  });

  it("reports a failed delete in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(deletePassThroughEndpointsCall).mockRejectedValue(new Error("boom"));
    render(<PassThroughSettings {...defaultProps} />);

    await user.click(await screen.findByText("delete-ep-1"));
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除 Endpoint 时出错：Error: boom"));
  });
});
