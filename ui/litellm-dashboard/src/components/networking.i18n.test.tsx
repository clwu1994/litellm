import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import {
  applyGuardrail,
  deleteConfigFieldSetting,
  enrichPolicyTemplateStream,
  getAgentCreateMetadata,
  getAgentInfo,
  getAgentsList,
  getEmailEventSettings,
  getGuardrailInfo,
  getGuardrailProviderSpecificParams,
  getGuardrailUISettings,
  getProviderCreateMetadata,
  handleError,
  keyCreateForAgentCall,
  keyInfoCall,
  keyInfoV1Call,
  modelCreateCall,
  patchAgentCall,
  resetEmailEventSettings,
  teamUpdateCall,
  testCustomCodeGuardrail,
  testPoliciesAndGuardrails,
  updateConfigFieldSetting,
  updateEmailEventSettings,
  updateGuardrailCall,
  updatePassThroughEndpoint,
  userBulkUpdateUserCall,
  validateBlockedWordsFile,
} from "./networking";

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    fromError: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const fetchMock = vi.fn();

const failureResponse = (body = "") => ({
  ok: false,
  status: 500,
  statusText: "Server Error",
  text: async () => body,
  json: async () => ({}),
  body: null,
});

const successResponse = (body: unknown = {}) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  text: async () => JSON.stringify(body),
  json: async () => body,
  body: null,
});

const stubFetch = (response: ReturnType<typeof failureResponse> | ReturnType<typeof successResponse>): void => {
  fetchMock.mockResolvedValue(response as unknown as Response);
};

const thrownMessage = async (run: () => Promise<unknown>): Promise<string> => {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("expected the call to reject");
};

const expectThrowPair = async (run: () => Promise<unknown>, zh: string, en: string): Promise<void> => {
  const message = await thrownMessage(run);
  expect(message).toBe(zh);
  expect(message).not.toBe(en);
};

describe("networking Chinese error copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("translates the expired-session notice", async () => {
    await handleError("Authentication Error - Expired Key");

    expect(toast.info).toHaveBeenCalledWith("UI 会话已过期，正在退出登录。");
    expect(toast.info).not.toHaveBeenCalledWith("UI Session Expired. Logging out.");
  });

  it("translates the provider-config load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => getProviderCreateMetadata(),
      "加载提供商配置失败",
      "Failed to load provider configuration",
    );
  });

  it("translates the agent-config load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(() => getAgentCreateMetadata(), "加载 Agent 配置失败", "Failed to load agent configuration");
  });

  it("translates the agent key creation failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => keyCreateForAgentCall("sk-test", "agent-1", "alias", []),
      "为 Agent 创建密钥失败",
      "Failed to create key for agent",
    );
  });

  it("translates the generic network response failure", async () => {
    stubFetch(failureResponse("something went wrong"));

    await expectThrowPair(() => keyInfoCall("sk-test", ["key-1"]), "网络响应异常", "Network response was not ok");
  });

  it("translates the invalid proxy token failure", async () => {
    stubFetch(failureResponse("Invalid proxy server token passed"));

    await expectThrowPair(
      () => keyInfoCall("sk-test", ["key-1"]),
      "传入的代理服务器 Token 无效",
      "Invalid proxy server token passed",
    );
  });

  it("translates the bulk-update target failure", async () => {
    await expectThrowPair(
      () => userBulkUpdateUserCall("sk-test", {}),
      "必须提供 userIds 或将 allUsers 设为 true",
      "Must provide either userIds or set allUsers=true",
    );
  });

  it("translates the config field update toast", async () => {
    stubFetch(successResponse());

    await updateConfigFieldSetting("sk-test", "field", "value");

    expect(toast.success).toHaveBeenCalledWith("值更新成功！");
    expect(toast.success).not.toHaveBeenCalledWith("Successfully updated value!");
  });

  it("translates the config field reset toast", async () => {
    stubFetch(successResponse());

    await deleteConfigFieldSetting("sk-test", "field");

    expect(toast.success).toHaveBeenCalledWith("字段已在代理上重置");
    expect(toast.success).not.toHaveBeenCalledWith("Field reset on proxy");
  });

  it("translates the missing response body failure", async () => {
    stubFetch(successResponse());

    await expectThrowPair(
      () =>
        enrichPolicyTemplateStream(
          "sk-test",
          "tpl-1",
          {},
          "gpt-4o",
          () => {},
          () => {},
        ),
      "响应体为空",
      "No response body",
    );
  });

  it("translates the email event settings load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => getEmailEventSettings("sk-test"),
      "获取邮件事件设置失败",
      "Failed to get email event settings",
    );
  });

  it("translates the email event settings update failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => updateEmailEventSettings("sk-test", { settings: [] }),
      "更新邮件事件设置失败",
      "Failed to update email event settings",
    );
  });

  it("translates the email event settings reset failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => resetEmailEventSettings("sk-test"),
      "重置邮件事件设置失败",
      "Failed to reset email event settings",
    );
  });

  it("translates the guardrail UI settings load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => getGuardrailUISettings("sk-test"),
      "获取 Guardrail UI 设置失败",
      "Failed to get guardrail UI settings",
    );
  });

  it("translates the guardrail provider params load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => getGuardrailProviderSpecificParams("sk-test"),
      "获取 Guardrail 提供商特定参数失败",
      "Failed to get guardrail provider specific parameters",
    );
  });

  it("translates the agents list load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(() => getAgentsList("sk-test"), "获取 Agent 列表失败", "Failed to get agents list");
  });

  it("translates the agent info load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(() => getAgentInfo("sk-test", "agent-1"), "获取 Agent 信息失败", "Failed to get agent info");
  });

  it("translates the guardrail info load failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => getGuardrailInfo("sk-test", "guardrail-1"),
      "获取 Guardrail 信息失败",
      "Failed to get guardrail info",
    );
  });

  it("translates the agent patch failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(() => patchAgentCall("sk-test", "agent-1", {}), "更新 Agent 失败", "Failed to patch agent");
  });

  it("translates the guardrail update failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => updateGuardrailCall("sk-test", "guardrail-1", {}),
      "更新 Guardrail 失败",
      "Failed to update guardrail",
    );
  });

  it("translates the blocked words validation failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => validateBlockedWordsFile("sk-test", "bad-word"),
      "校验屏蔽词文件失败",
      "Failed to validate blocked words file",
    );
  });

  it("translates the pass through endpoint update toast", async () => {
    stubFetch(successResponse());

    await updatePassThroughEndpoint("sk-test", "/endpoint", {});

    expect(toast.success).toHaveBeenCalledWith("透传 Endpoint 更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Pass through endpoint updated successfully");
  });

  it("translates the policy and guardrail test failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => testPoliciesAndGuardrails("sk-test", { policy_names: ["policy-1"] }),
      "测试策略和 Guardrails 失败",
      "Failed to test policies and guardrails",
    );
  });

  it("translates the guardrail apply failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => applyGuardrail("sk-test", "guardrail-1", "hello"),
      "应用 Guardrail 失败",
      "Failed to apply guardrail",
    );
  });

  it("translates the custom code guardrail test failure", async () => {
    stubFetch(failureResponse());

    await expectThrowPair(
      () => testCustomCodeGuardrail("sk-test", { custom_code: "return True", test_input: { texts: ["hello"] } }),
      "测试自定义代码 Guardrail 失败",
      "Failed to test custom code guardrail",
    );
  });

  it("translates the model-created toast", async () => {
    stubFetch(successResponse({ model_id: "m-1" }));

    await modelCreateCall("sk-test", { model_name: "gpt-4o" } as unknown as Parameters<typeof modelCreateCall>[1]);

    expect(toast.success).toHaveBeenCalledWith("模型 gpt-4o 创建成功");
    expect(toast.success).not.toHaveBeenCalledWith("Model gpt-4o created successfully");
  });

  it("translates the key info fetch failure", async () => {
    stubFetch(failureResponse("boom"));

    await keyInfoV1Call("sk-test", "key-1");

    expect(toast.fromError).toHaveBeenCalledWith("获取密钥信息失败 - boom");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to fetch key info - boom");
  });

  it("translates the team settings update failure", async () => {
    stubFetch(failureResponse("boom"));

    await expect(teamUpdateCall("sk-test", {})).rejects.toThrow("boom");

    expect(toast.fromError).toHaveBeenCalledWith("更新团队设置失败：boom");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update team settings: boom");
  });
});
