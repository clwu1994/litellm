import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import UpdateModelCredentialsModal from "./update_model_credentials_modal";

vi.mock("./networking", async () => {
  const actual = await vi.importActual("./networking");
  return { ...actual, modelPatchUpdateCall: vi.fn().mockResolvedValue({}) };
});

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

const renderModal = () =>
  render(
    <UpdateModelCredentialsModal
      open
      onCancel={vi.fn()}
      accessToken="test-token"
      modelId="model-123"
      onUpdated={vi.fn()}
    />,
  );

describe("UpdateModelCredentialsModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese title, description, note and field copy", () => {
    renderModal();

    expect(screen.getByRole("heading", { name: "更新 API Key" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Update API Key" })).not.toBeInTheDocument();
    expect(screen.getByText("更新此模型的 API Key。仅发送新密钥，部署配置的其余部分保持不变。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Update this model's API key. Only the new key is sent; the rest of the deployment configuration is left untouched.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "此处仅轮换 API Key。使用 Azure AD token、AWS 凭证或 Vertex 服务账号 JSON 进行身份验证的模型暂不支持；请暂时通过模型的 LiteLLM 参数更新它们。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("新的 API Key")).toBeInTheDocument();
    expect(screen.queryByText("New API Key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入新的 API Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter the new API key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the Chinese required-field validation message", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "更新 API Key" }));

    expect(await screen.findByText("请输入新的 API Key")).toBeInTheDocument();
    expect(screen.queryByText("Enter a new API key")).not.toBeInTheDocument();
  });
});
