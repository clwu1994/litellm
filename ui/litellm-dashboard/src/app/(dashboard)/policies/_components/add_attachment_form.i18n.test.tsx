/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import * as networking from "@/components/networking";
import type { Policy } from "@/components/policies/types";

import AddAttachmentForm from "./add_attachment_form";

vi.mock("@/components/networking");

type UserEvent = ReturnType<typeof userEvent.setup>;

const makePolicy = (overrides: Partial<Policy> = {}): Policy => ({
  policy_id: "policy-id-1",
  policy_name: "policy-alpha",
  inherit: null,
  description: null,
  guardrails_add: [],
  guardrails_remove: [],
  condition: null,
  ...overrides,
});

const defaultProps = {
  visible: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  accessToken: "test-token" as string | null,
  policies: [makePolicy(), makePolicy({ policy_name: "policy-beta", policy_id: "id-2" })],
  createAttachment: vi.fn().mockResolvedValue({}),
};

const teamListResult = (aliases: string[]) =>
  aliases.map((team_alias) => ({ team_alias })) as unknown as Awaited<ReturnType<typeof networking.teamListCall>>;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const openSpecificScope = async (user: UserEvent) => {
  await screen.findByText("创建策略附件");
  await user.click(screen.getByRole("radio", { name: "特定（团队、密钥、模型或标签）" }));
};

const selectPolicies = async (user: UserEvent, label: string, names: string[]) => {
  await user.click(screen.getByLabelText(label));
  for (const name of names) {
    await user.click(await screen.findByRole("option", { name }));
  }
  await user.keyboard("{Escape}");
};

describe("AddAttachmentForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.teamListCall).mockResolvedValue([]);
    vi.mocked(networking.keyListCall).mockResolvedValue({ keys: [] });
    vi.mocked(networking.modelAvailableCall).mockResolvedValue({ data: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, policies field and scope chrome", async () => {
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);

    expect(await screen.findByText("创建策略附件")).toBeInTheDocument();
    expect(screen.queryByText("Create Policy Attachment")).not.toBeInTheDocument();
    expect(screen.getByLabelText("策略")).toBeInTheDocument();
    expect(screen.queryByLabelText("Policies")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要附加的策略")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select policies to attach")).not.toBeInTheDocument();
    expect(screen.getByText("范围")).toBeInTheDocument();
    expect(screen.queryByText("Scope")).not.toBeInTheDocument();
    expect(screen.getByText("范围类型")).toBeInTheDocument();
    expect(screen.queryByText("Scope Type")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "特定（团队、密钥、模型或标签）" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Specific (teams, keys, models, or tags)" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "全局（应用于所有请求）" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Global (applies to all requests)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建附件" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Attachment" })).not.toBeInTheDocument();
  });

  it("renders the Chinese specific-scope field labels and placeholders", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await openSpecificScope(user);

    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.queryByText("Teams")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入团队别名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter team aliases")).not.toBeInTheDocument();
    expect(screen.getByText("密钥")).toBeInTheDocument();
    expect(screen.queryByText("Keys")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入密钥别名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter key aliases")).not.toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入模型名称（例如 gpt-4、bedrock/*）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Select or enter model names (e.g., gpt-4, bedrock/*)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入标签并按 Enter（例如 healthcare、prod-*）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Type a tag and press Enter (e.g. healthcare, prod-*)"),
    ).not.toBeInTheDocument();

    const tagsDescription = screen.getByText("metadata.tags").closest("[data-slot='field-description']");
    expect(tagsDescription).toHaveTextContent(
      "匹配密钥/团队 metadata.tags 中的标签，或请求正文中动态传入的标签。使用 * 作为后缀通配符（例如 prod-* 匹配 prod-us、prod-eu）。",
    );
    expect(tagsDescription).not.toHaveTextContent(
      "Matches tags from key/team metadata.tags or tags passed dynamically in the request body. Use * as a suffix wildcard (e.g., prod-* matches prod-us, prod-eu).",
    );

    expect(screen.getByRole("button", { name: "预估影响" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Estimate Impact" })).not.toBeInTheDocument();
  });

  it("renders the Chinese tooltips while each is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await openSpecificScope(user);

    const teamsLabel = screen.getByText("团队");
    const teamsTrigger = teamsLabel.closest("label")?.querySelector("svg");
    if (!teamsTrigger) throw new Error("no teams hint trigger");
    await user.hover(teamsTrigger);
    expect(
      await screen.findByText("选择团队别名或输入自定义模式。支持通配符（例如 healthcare-*）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Select team aliases or enter custom patterns. Supports wildcards (e.g., healthcare-*)"),
    ).not.toBeInTheDocument();

    const keysLabel = screen.getByText("密钥");
    const keysTrigger = keysLabel.closest("label")?.querySelector("svg");
    if (!keysTrigger) throw new Error("no keys hint trigger");
    await user.hover(keysTrigger);
    expect(await screen.findByText("选择密钥别名或输入自定义模式。支持通配符（例如 dev-*）")).toBeInTheDocument();
    expect(
      screen.queryByText("Select key aliases or enter custom patterns. Supports wildcards (e.g., dev-*)"),
    ).not.toBeInTheDocument();

    const modelsLabel = screen.getByText("模型");
    const modelsTrigger = modelsLabel.closest("label")?.querySelector("svg");
    if (!modelsTrigger) throw new Error("no models hint trigger");
    await user.hover(modelsTrigger);
    expect(
      await screen.findByText("此附件适用的模型名称。支持通配符（例如 gpt-4*）。留空则应用于所有模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Model names this attachment applies to. Supports wildcards (e.g., gpt-4*). Leave empty to apply to all models.",
      ),
    ).not.toBeInTheDocument();

    const tagsLabel = screen.getByText("标签");
    const tagsTrigger = tagsLabel.closest("label")?.querySelector("svg");
    if (!tagsTrigger) throw new Error("no tags hint trigger");
    await user.hover(tagsTrigger);
    expect(
      await screen.findByText(
        "匹配密钥或团队元数据中设置的标签。使用精确值（例如 healthcare）或通配符模式（例如 health-*），其中 * 匹配任意后缀。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Match against tags set in key or team metadata. Use exact values (e.g., healthcare) or wildcard patterns (e.g., health-*) where * matches any suffix.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the English tags description byte-identically after the Trans conversion", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Policy Attachment");

    await user.click(screen.getByRole("radio", { name: "Specific (teams, keys, models, or tags)" }));

    const tagsDescription = screen.getByText("metadata.tags").closest("[data-slot='field-description']");
    expect(tagsDescription).toHaveTextContent(
      "Matches tags from key/team metadata.tags or tags passed dynamically in the request body. Use * as a suffix wildcard (e.g., prod-* matches prod-us, prod-eu).",
    );
  });

  it("renders the Chinese empty text for the policies combobox", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("创建策略附件");

    await user.click(screen.getByLabelText("策略"));
    await user.type(screen.getByLabelText("策略"), "zzz");

    expect(await screen.findByText("没有匹配的策略")).toBeInTheDocument();
    expect(screen.queryByText("No matching policies")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text for the empty team, key and model lists", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await openSpecificScope(user);

    await user.click(screen.getByLabelText("团队"));
    expect(await screen.findByText("没有匹配的团队")).toBeInTheDocument();
    expect(screen.queryByText("No matching teams")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText("密钥"));
    expect(await screen.findByText("没有匹配的密钥")).toBeInTheDocument();
    expect(screen.queryByText("No matching keys")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText("模型"));
    expect(await screen.findByText("没有匹配的模型")).toBeInTheDocument();
    expect(screen.queryByText("No matching models")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholders for teams, keys and models", async () => {
    const user = userEvent.setup();
    const teams = deferred<Awaited<ReturnType<typeof networking.teamListCall>>>();
    const keys = deferred<Awaited<ReturnType<typeof networking.keyListCall>>>();
    const models = deferred<Awaited<ReturnType<typeof networking.modelAvailableCall>>>();
    vi.mocked(networking.teamListCall).mockReturnValue(teams.promise);
    vi.mocked(networking.keyListCall).mockReturnValue(keys.promise);
    vi.mocked(networking.modelAvailableCall).mockReturnValue(models.promise);

    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await openSpecificScope(user);

    expect(await screen.findByPlaceholderText("正在加载团队...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading teams...")).not.toBeInTheDocument();

    teams.resolve([]);
    expect(await screen.findByPlaceholderText("正在加载密钥...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading keys...")).not.toBeInTheDocument();

    keys.resolve({ keys: [] });
    expect(await screen.findByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-policy validation and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("创建策略附件");

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    expect(await screen.findByText("请至少选择一个策略")).toBeInTheDocument();
    expect(screen.queryByText("Please select at least one policy")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-team validation and hides the English", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.teamListCall).mockResolvedValue(teamListResult(["real-team"]));
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await openSpecificScope(user);
    await waitFor(() => expect(networking.teamListCall).toHaveBeenCalled());

    const teamsInput = screen.getByLabelText("团队");
    await user.click(teamsInput);
    await user.type(teamsInput, "ghost-team{Enter}");
    await user.click(screen.getByRole("button", { name: "创建附件" }));

    expect(
      await screen.findByText('以下团队不存在：ghost-team。请选择现有团队，或使用 "team-*" 之类的通配符按前缀匹配。'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'These teams don\'t exist: ghost-team. Choose an existing team, or use a wildcard like "team-*" to match by prefix.',
      ),
    ).not.toBeInTheDocument();
  });

  it("toasts the Chinese create success for a single attachment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("附件创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Attachment created successfully");
  });

  it("toasts the Chinese plural create success for several attachments", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha", "policy-beta"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已成功创建 2 个附件"));
    expect(toast.success).not.toHaveBeenCalledWith("2 attachments created successfully");
    expect(toast.success).not.toHaveBeenCalledWith("附件创建成功");
  });

  it("selects the singular and plural created toasts in English", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();

    const first = renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Policy Attachment");
    await selectPolicies(user, "Policies", ["policy-alpha"]);
    await user.click(screen.getByRole("button", { name: "Create Attachment" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Attachment created successfully"));
    first.unmount();

    renderWithProviders(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Policy Attachment");
    await selectPolicies(user, "Policies", ["policy-alpha", "policy-beta"]);
    await user.click(screen.getByRole("button", { name: "Create Attachment" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("2 attachments created successfully"));
    expect(toast.success).not.toHaveBeenCalledWith("2 attachment created successfully");
  });

  it("toasts the Chinese partial-creation failure and hides the English", async () => {
    const user = userEvent.setup();
    const createAttachment = vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<AddAttachmentForm {...defaultProps} createAttachment={createAttachment} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha", "policy-beta"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("已创建 1 个附件，1 个失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("1 attachments created, 1 failed");
  });

  it("toasts the Chinese create failure with the error message and hides the English", async () => {
    const user = userEvent.setup();
    const createAttachment = vi.fn().mockRejectedValue(new Error("boom"));
    renderWithProviders(<AddAttachmentForm {...defaultProps} createAttachment={createAttachment} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建附件失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create attachment: boom");
  });

  it("toasts the Chinese all-failed message when a rejection is not an Error", async () => {
    const user = userEvent.setup();
    const createAttachment = vi.fn().mockRejectedValue("nope");
    renderWithProviders(<AddAttachmentForm {...defaultProps} createAttachment={createAttachment} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建附件失败：创建附件失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create attachment: Failed to create attachments");
  });

  it("toasts the Chinese no-access-token failure and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddAttachmentForm {...defaultProps} accessToken={null} />);
    await screen.findByText("创建策略附件");
    await selectPolicies(user, "策略", ["policy-alpha"]);

    await user.click(screen.getByRole("button", { name: "创建附件" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建附件失败：没有可用的访问 Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create attachment: No access token available");
  });
});
