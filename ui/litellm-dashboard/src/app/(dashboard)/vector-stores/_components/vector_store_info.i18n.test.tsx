/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { credentialListCall, vectorStoreInfoCall, vectorStoreUpdateCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VectorStoreInfoView from "./vector_store_info";

vi.mock("@/components/networking", () => ({
  vectorStoreInfoCall: vi.fn(),
  vectorStoreUpdateCall: vi.fn(),
  credentialListCall: vi.fn(),
}));

vi.mock("./VectorStoreTester", () => ({ __esModule: true, default: () => null }));

const mockInfo = vi.mocked(vectorStoreInfoCall);
const mockUpdate = vi.mocked(vectorStoreUpdateCall);
const mockCredentials = vi.mocked(credentialListCall);

const serverRecord = {
  vector_store_id: "vs-1",
  vector_store_name: "support-docs-store",
  vector_store_description: "Docs for support",
  custom_llm_provider: "bedrock",
  vector_store_metadata: { tier: "gold" },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-02-02T00:00:00Z",
  litellm_credential_name: "bedrock-prod",
};

const renderView = (editVectorStore: boolean) =>
  renderWithProviders(
    <VectorStoreInfoView
      vectorStoreId="vs-1"
      onClose={vi.fn()}
      accessToken="sk-test"
      is_admin={true}
      editVectorStore={editVectorStore}
    />,
  );

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("VectorStoreInfoView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockInfo.mockResolvedValue({ vector_store: serverRecord });
    mockCredentials.mockResolvedValue({ credentials: [{ credential_name: "bedrock-prod" }] });
    mockUpdate.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state", async () => {
    mockInfo.mockReturnValue(new Promise(() => {}));
    renderView(false);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    await act(async () => {});
  });

  it("renders the Chinese not-found state with the English originals absent", async () => {
    mockInfo.mockRejectedValue(new Error("boom"));
    renderView(false);

    expect(await screen.findByText("未找到向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Vector store not found")).not.toBeInTheDocument();
    expect(screen.getByText("无法加载向量存储 vs-1，它可能已被删除。")).toBeInTheDocument();
    expect(screen.queryByText(/could not be loaded/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Vector Stores" })).not.toBeInTheDocument();
  });

  it("renders the Chinese details view with the English originals absent", async () => {
    mockInfo.mockResolvedValue({ vector_store: { ...serverRecord, vector_store_description: null } });
    renderView(false);

    expect(await screen.findByText("向量存储 ID：vs-1")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store ID: vs-1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回向量存储" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "编辑向量存储" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Edit Vector Store" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "详情" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Details" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "测试向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Test Vector Store" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "向量存储详情" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vector Store Details" })).not.toBeInTheDocument();
    expect(screen.getByText("无描述")).toBeInTheDocument();
    expect(screen.queryByText("No description")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["ID", "ID"],
      ["名称", "Name"],
      ["描述", "Description"],
      ["提供方", "Provider"],
      ["元数据", "Metadata"],
      ["创建时间", "Created"],
      ["最后更新", "Last Updated"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      if (en !== zh) {
        expect(screen.queryByText(en)).not.toBeInTheDocument();
      }
    }
  });

  it("renders the Chinese edit form with the English originals absent", async () => {
    renderView(true);

    expect(await screen.findByDisplayValue("support-docs-store")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "编辑向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Edit Vector Store" })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["向量存储 ID", "Vector Store ID"],
      ["向量存储名称", "Vector Store Name"],
      ["描述", "Description"],
      ["提供方", "Provider"],
      ["现有凭证", "Existing Credentials"],
      ["元数据", "Metadata"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(screen.getByText("选择现有凭证，或在下方输入提供方凭证")).toBeInTheDocument();
    expect(
      screen.queryByText("Either select existing credentials OR enter provider credentials below"),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或搜索现有凭证")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or search for existing credentials")).not.toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(screen.queryByText("OR")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese provider and metadata hints while they are open", async () => {
    const user = userEvent.setup({ delay: null });
    renderView(true);
    await screen.findByDisplayValue("support-docs-store");

    await hoverHint(user, "提供方");
    expect(await screen.findByText("选择此向量存储的提供方")).toBeInTheDocument();
    expect(screen.queryByText("Select the provider for this vector store")).not.toBeInTheDocument();

    await hoverHint(user, "元数据");
    expect(await screen.findByText("向量存储的 JSON 元数据")).toBeInTheDocument();
    expect(screen.queryByText("JSON metadata for the vector store")).not.toBeInTheDocument();
  });

  it("renders the Chinese credential options and no-match empty state", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByDisplayValue("support-docs-store");

    const input = screen.getByPlaceholderText("选择或搜索现有凭证");
    await user.click(input);

    expect(await screen.findByText("无")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();

    await user.type(input, "zzz");
    expect(await screen.findByText("未找到匹配的凭证")).toBeInTheDocument();
    expect(screen.queryByText("No matching credentials")).not.toBeInTheDocument();
  });

  it("renders the Chinese validation messages for the required id and provider", async () => {
    const user = userEvent.setup();
    mockInfo.mockResolvedValue({
      vector_store: { ...serverRecord, vector_store_id: "", custom_llm_provider: "" },
    });
    renderView(true);

    await screen.findByDisplayValue("support-docs-store");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("请输入向量存储 ID")).toBeInTheDocument();
    expect(screen.queryByText("Please input a vector store ID")).not.toBeInTheDocument();
    expect(screen.getByText("请选择提供方")).toBeInTheDocument();
    expect(screen.queryByText("Please select a provider")).not.toBeInTheDocument();
  });

  it("shows the Chinese fetch-failure toast with the English original absent", async () => {
    mockInfo.mockRejectedValue(new Error("boom"));
    renderView(false);

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取向量存储详情失败：Error: boom"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching vector store details: Error: boom");
  });

  it("shows the Chinese invalid-metadata toast with the English original absent", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByDisplayValue("support-docs-store");

    const metadataInput = screen.getByPlaceholderText('{"key": "value"}');
    await user.clear(metadataInput);
    await user.type(metadataInput, "not json");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("元数据字段中的 JSON 无效"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON in metadata field");
  });

  it("shows the Chinese updated toast with the English original absent", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByDisplayValue("support-docs-store");

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("向量存储更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Vector store updated successfully");
  });

  it("shows the Chinese update-failure toast with the English original absent", async () => {
    const user = userEvent.setup();
    mockUpdate.mockRejectedValue(new Error("boom"));
    renderView(true);
    await screen.findByDisplayValue("support-docs-store");

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新向量存储失败：Error: boom"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Error updating vector store: Error: boom");
  });
});
