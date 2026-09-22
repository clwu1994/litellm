/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { registerClaudeCodePlugin } from "@/components/networking";
import { toast } from "@/lib/toast";

import AddPluginForm from "./add_plugin_form";

vi.mock("@/components/networking", () => ({
  registerClaudeCodePlugin: vi.fn().mockResolvedValue({ status: "success" }),
}));

const mockRegister = vi.mocked(registerClaudeCodePlugin);
const mockMessageError = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "sk-test",
  onSuccess: vi.fn(),
};

const URL_PLACEHOLDER = "https://github.com/org/repo 或 https://bucket.s3.amazonaws.com/my-skill.zip";
const SUBPATH_PLACEHOLDER = "plugins/my-skill";
const S3_ZIP_URL = "https://skills-bucket.s3.us-east-1.amazonaws.com/plugins/s3-skill-1.0.0.zip";
const GITHUB_URL = "https://github.com/anthropics/claude-code";

const renderForm = (accessToken: string | null = "sk-test") =>
  renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} accessToken={accessToken} />);

const openHint = async (user: ReturnType<typeof userEvent.setup>, label: string): Promise<HTMLElement> => {
  const trigger = screen.getByText(label).closest("label")?.querySelector('[data-slot="tooltip-trigger"]');
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

interface HintCase {
  zhLabel: string;
  enLabel: string;
  zh: string;
  en: string;
}

const HINTS: HintCase[] = [
  {
    zhLabel: "来源 URL",
    enLabel: "Source URL",
    zh: "粘贴来自 GitHub、GitLab、Bitbucket 或自托管主机的 HTTPS git 仓库 URL（例如 github.com/org/repo 或 github.com/org/repo/tree/main/my-skill），或指向托管在 S3 或任意静态文件服务器上的技能 .zip 归档的 HTTPS 链接。",
    en: "Paste an HTTPS git repository URL from GitHub, GitLab, Bitbucket, or a self-hosted host (e.g. github.com/org/repo or github.com/org/repo/tree/main/my-skill), or an HTTPS link to a .zip archive of the skill hosted on S3 or any static file server.",
  },
  {
    zhLabel: "子文件夹路径（可选）",
    enLabel: "Subfolder path (Optional)",
    zh: "技能在仓库中的路径（例如 plugins/my-skill）。如果技能位于仓库根目录，请留空。",
    en: "Path within the repository where the skill lives (e.g., plugins/my-skill). Leave empty if the skill is at the repo root.",
  },
  {
    zhLabel: "技能名称",
    enLabel: "Skill Name",
    zh: "kebab-case 格式的唯一标识符（例如 my-skill）",
    en: "Unique identifier in kebab-case format (e.g., my-skill)",
  },
  {
    zhLabel: "领域（可选）",
    enLabel: "Domain (Optional)",
    zh: "Skill Hub 中的顶层分组（例如 Productivity）",
    en: "Top-level grouping in the Skill Hub (e.g., Productivity)",
  },
  {
    zhLabel: "命名空间（可选）",
    enLabel: "Namespace (Optional)",
    zh: "领域内的子分组（例如 workflows）",
    en: "Sub-grouping within domain (e.g., workflows)",
  },
  {
    zhLabel: "描述（可选）",
    enLabel: "Description (Optional)",
    zh: "技能的简要说明",
    en: "Brief description of what the skill does",
  },
  {
    zhLabel: "类别（可选）",
    enLabel: "Category (Optional)",
    zh: "选择一个类别或输入自定义类别",
    en: "Select a category or enter a custom one",
  },
  {
    zhLabel: "关键词（可选）",
    enLabel: "Keywords (Optional)",
    zh: "用于搜索的逗号分隔关键词列表",
    en: "Comma-separated list of keywords for search",
  },
  {
    zhLabel: "版本（可选）",
    enLabel: "Version (Optional)",
    zh: "语义化版本（例如 1.0.0）",
    en: "Semantic version (e.g., 1.0.0)",
  },
  {
    zhLabel: "作者名称（可选）",
    enLabel: "Author Name (Optional)",
    zh: "技能作者或组织的名称",
    en: "Name of the skill author or organization",
  },
  {
    zhLabel: "作者邮箱（可选）",
    enLabel: "Author Email (Optional)",
    zh: "技能作者的联络邮箱",
    en: "Contact email for the skill author",
  },
];

const SHA256_HINT: HintCase = {
  zhLabel: "归档 SHA-256（可选）",
  enLabel: "Archive SHA-256 (Optional)",
  zh: "zip 文件的十六进制摘要。如果校验和不匹配，Claude Code 会拒绝安装该归档。",
  en: "Hex digest of the zip file. Claude Code refuses to install the archive if its checksum does not match.",
};

const submit = (name = "添加技能") => fireEvent.click(screen.getByRole("button", { name }));

describe("AddPluginForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockRegister.mockResolvedValue({ status: "success" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, field labels and actions and hides the English originals", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "添加新技能" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add New Skill" })).not.toBeInTheDocument();

    for (const { zhLabel, enLabel } of HINTS) {
      expect(screen.getByLabelText(zhLabel)).toBeInTheDocument();
      expect(screen.queryByLabelText(enLabel)).not.toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加技能" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Skill" })).not.toBeInTheDocument();
  });

  it("renders each Chinese field hint in its open tooltip and hides the English original", async () => {
    const user = userEvent.setup();
    renderForm();

    for (const { zhLabel, zh, en } of HINTS) {
      const tooltip = await openHint(user, zhLabel);
      expect(tooltip).toHaveTextContent(zh);
      expect(tooltip).not.toHaveTextContent(en);
    }
  });

  it("renders the Chinese archive hint, lock reason, digest placeholder and detected preview", async () => {
    const user = userEvent.setup();
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: S3_ZIP_URL } });

    const tooltip = await openHint(user, SHA256_HINT.zhLabel);
    expect(tooltip).toHaveTextContent(SHA256_HINT.zh);
    expect(tooltip).not.toHaveTextContent(SHA256_HINT.en);

    expect(screen.getByPlaceholderText("64 个十六进制字符")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("64 hex characters")).not.toBeInTheDocument();

    expect(screen.getByText("zip 归档会整体安装，因此此字段已禁用")).toBeInTheDocument();
    expect(
      screen.queryByText("A zip archive is installed as a whole, so this field is disabled"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("已检测到：Zip archive — skills-bucket.s3.us-east-1.amazonaws.com/plugins/s3-skill-1.0.0.zip"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Detected: Zip archive — skills-bucket.s3.us-east-1.amazonaws.com/plugins/s3-skill-1.0.0.zip"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese subfolder lock reason for a tree URL and hides the English original", async () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), {
      target: { value: "https://github.com/anthropics/claude-code/tree/main/plugins/my-skill" },
    });

    expect(screen.getByText("URL 已指向子文件夹，因此此字段已禁用")).toBeInTheDocument();
    expect(
      screen.queryByText("The URL already points to a subfolder, so this field is disabled"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese placeholders and hides the English originals", () => {
    renderForm();

    expect(screen.getByPlaceholderText(URL_PLACEHOLDER)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip"),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("一个可以帮助…的技能")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("A skill that helps with...")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入类别")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or type a category")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("你的姓名或组织")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Your Name or Organization")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("my-skill")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Productivity")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("workflows")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("search, web, api")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1.0.0")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("author@example.com")).toBeInTheDocument();
  });

  it("renders the Chinese empty category option and hides the English original", async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByPlaceholderText("选择或输入类别");
    await user.click(input);
    await user.type(input, "zzz");

    expect(await screen.findByText("没有匹配的类别")).toBeInTheDocument();
    expect(screen.queryByText("No matching categories")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-field errors and hides the English originals", async () => {
    renderForm();

    submit();

    expect(await screen.findByText("请输入仓库或 zip 归档 URL")).toBeInTheDocument();
    expect(screen.getByText("请输入技能名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a repository or zip archive URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Please enter skill name")).not.toBeInTheDocument();
  });

  it("renders the Chinese format errors and hides the English originals", async () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });
    fireEvent.change(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER), { target: { value: "!!" } });
    fireEvent.change(screen.getByPlaceholderText("my-skill"), { target: { value: "Bad_Name" } });
    fireEvent.change(screen.getByPlaceholderText("author@example.com"), { target: { value: "nope" } });

    submit();

    expect(
      await screen.findByText("子文件夹必须是相对路径，例如 plugins/my-skill（字母、数字、点、连字符、下划线）"),
    ).toBeInTheDocument();
    expect(screen.getByText("名称必须为 kebab-case（仅限小写字母、数字和连字符）")).toBeInTheDocument();
    expect(screen.getByText("请输入有效的邮箱")).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Subfolder must be a relative path like plugins/my-skill (letters, numbers, dots, hyphens, underscores)",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Name must be kebab-case (lowercase, numbers, hyphens only)")).not.toBeInTheDocument();
    expect(screen.queryByText("Please enter a valid email")).not.toBeInTheDocument();
  });

  it("renders the Chinese digest error and hides the English original", async () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: S3_ZIP_URL } });
    fireEvent.change(screen.getByPlaceholderText("64 个十六进制字符"), { target: { value: "not-a-digest" } });

    submit();

    expect(await screen.findByText("SHA-256 必须是 64 个字符的十六进制摘要")).toBeInTheDocument();
    expect(screen.queryByText("SHA-256 must be a 64-character hex digest")).not.toBeInTheDocument();
  });

  it("renders the Chinese submit toasts and hides the English originals", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });

    submit();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("技能注册成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Skill registered successfully");

    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });
    mockRegister.mockRejectedValueOnce(new Error(""));
    submit();
    await waitFor(() => expect(mockMessageError).toHaveBeenCalledWith("注册技能失败"));
    expect(mockMessageError).not.toHaveBeenCalledWith("Failed to register skill");
  });

  it("renders the Chinese submitting label while the registration is in flight", async () => {
    mockRegister.mockReturnValueOnce(new Promise(() => {}));
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });

    submit();

    expect(await screen.findByRole("button", { name: "添加中…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adding..." })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-access-token toast and hides the English original", async () => {
    renderForm(null);
    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });

    submit();

    await waitFor(() => expect(mockMessageError).toHaveBeenCalledWith("没有可用的访问 Token"));
    expect(mockMessageError).not.toHaveBeenCalledWith("No access token available");
  });

  it("renders the Chinese invalid-source toast and hides the English original", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: "not a url" } });
    fireEvent.change(screen.getByPlaceholderText("my-skill"), { target: { value: "my-skill" } });

    submit();

    await waitFor(() => expect(mockMessageError).toHaveBeenCalledWith("请输入有效的仓库或 zip 归档 URL"));
    expect(mockMessageError).not.toHaveBeenCalledWith("Please enter a valid repository or zip archive URL");
  });

  it("renders the Chinese invalid-version toast and hides the English original", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value: GITHUB_URL } });
    fireEvent.change(screen.getByPlaceholderText("1.0.0"), { target: { value: "abc" } });

    submit();

    await waitFor(() => expect(mockMessageError).toHaveBeenCalledWith("版本必须为语义化版本格式（例如 1.0.0）"));
    expect(mockMessageError).not.toHaveBeenCalledWith("Version must be in semantic versioning format (e.g., 1.0.0)");
  });
});

describe("AddPluginForm English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockRegister.mockResolvedValue({ status: "success" });
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English title, labels, placeholders and actions byte-identical", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Add New Skill" })).toBeInTheDocument();
    for (const { enLabel } of HINTS) {
      expect(screen.getByLabelText(enLabel)).toBeInTheDocument();
    }
    expect(
      screen.getByPlaceholderText("https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("A skill that helps with...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select or type a category")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your Name or Organization")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Skill" })).toBeInTheDocument();
  });

  it("keeps every original English field hint byte-identical", async () => {
    const user = userEvent.setup();
    renderForm();

    for (const { enLabel, en } of HINTS) {
      const tooltip = await openHint(user, enLabel);
      expect(tooltip).toHaveTextContent(en);
    }
  });

  it("keeps the original English archive hint, lock reasons and detected preview byte-identical", async () => {
    const user = userEvent.setup();
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip"),
      {
        target: { value: S3_ZIP_URL },
      },
    );

    const tooltip = await openHint(user, SHA256_HINT.enLabel);
    expect(tooltip).toHaveTextContent(SHA256_HINT.en);
    expect(screen.getByPlaceholderText("64 hex characters")).toBeInTheDocument();
    expect(screen.getByText("A zip archive is installed as a whole, so this field is disabled")).toBeInTheDocument();
    expect(
      screen.getByText("Detected: Zip archive — skills-bucket.s3.us-east-1.amazonaws.com/plugins/s3-skill-1.0.0.zip"),
    ).toBeInTheDocument();
  });

  it("keeps the original English validation errors byte-identical", async () => {
    renderForm();

    submit("Add Skill");
    expect(await screen.findByText("Please enter a repository or zip archive URL")).toBeInTheDocument();
    expect(screen.getByText("Please enter skill name")).toBeInTheDocument();
  });

  it("keeps the original English submit toasts byte-identical", async () => {
    renderForm();
    fireEvent.change(
      screen.getByPlaceholderText("https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip"),
      { target: { value: GITHUB_URL } },
    );

    submit("Add Skill");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Skill registered successfully"));

    fireEvent.change(
      screen.getByPlaceholderText("https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip"),
      { target: { value: GITHUB_URL } },
    );
    mockRegister.mockRejectedValueOnce(new Error(""));
    submit("Add Skill");
    await waitFor(() => expect(mockMessageError).toHaveBeenCalledWith("Failed to register skill"));
  });
});
