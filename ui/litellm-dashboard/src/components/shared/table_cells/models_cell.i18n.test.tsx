import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ModelsCell } from "./models_cell";

describe("ModelsCell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese wildcard label and hides the English original", () => {
    renderWithProviders(<ModelsCell models={["all-proxy-models"]} />);

    expect(screen.getByText("所有 Proxy 模型")).toBeInTheDocument();
    expect(screen.queryByText("All Proxy Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-access label and hides the English original", () => {
    renderWithProviders(<ModelsCell models={[]} allowedRoutes={["management_routes"]} />);

    expect(screen.getByText("无模型访问权限")).toBeInTheDocument();
    expect(screen.queryByText("No model access")).not.toBeInTheDocument();
  });

  it("renders the Chinese scoped-routes tooltip and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelsCell models={[]} allowedRoutes={["management_routes"]} />);

    await user.hover(screen.getByText("无模型访问权限"));

    expect(await screen.findByText("范围限定为 管理 路由；此密钥无法调用任何模型")).toBeInTheDocument();
    expect(screen.queryByText("Scoped to Management routes; this key cannot call any models")).not.toBeInTheDocument();
    expect(screen.queryByText("范围限定为 Management 路由；此密钥无法调用任何模型")).not.toBeInTheDocument();
  });

  it("renders the Chinese read-only scope label and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelsCell models={[]} allowedRoutes={["info_routes"]} />);

    await user.hover(screen.getByText("无模型访问权限"));

    expect(await screen.findByText("范围限定为 只读 路由；此密钥无法调用任何模型")).toBeInTheDocument();
    expect(screen.queryByText("Scoped to Read-only routes; this key cannot call any models")).not.toBeInTheDocument();
  });

  it("renders the Chinese SCIM scope label and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelsCell models={[]} allowedRoutes={["/scim/*"]} />);

    await user.hover(screen.getByText("无模型访问权限"));

    expect(await screen.findByText("范围限定为 SCIM 路由；此密钥无法调用任何模型")).toBeInTheDocument();
    expect(screen.queryByText("Scoped to SCIM routes; this key cannot call any models")).not.toBeInTheDocument();
  });

  it("renders the Chinese overflow badge and hides the English original", () => {
    renderWithProviders(<ModelsCell models={["a", "b", "c", "d"]} maxVisible={2} />);

    expect(screen.getByText("还有 2 个")).toBeInTheDocument();
    expect(screen.queryByText("+2 more")).not.toBeInTheDocument();
  });
});
