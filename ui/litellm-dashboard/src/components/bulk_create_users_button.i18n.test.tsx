import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import BulkCreateUsersButton from "./bulk_create_users_button";

const proxyUiSettings = vi.hoisted(() => ({
  PROXY_BASE_URL: null,
  PROXY_LOGOUT_URL: null,
  DEFAULT_TEAM_DISABLED: false,
  SSO_ENABLED: false,
}));

vi.mock("./networking", () => ({
  userCreateCall: vi.fn(),
  invitationCreateCall: vi.fn(),
  getProxyUISettings: vi.fn().mockResolvedValue(proxyUiSettings),
}));

import { invitationCreateCall, userCreateCall } from "./networking";

const mockUserCreateCall = vi.mocked(userCreateCall);
const mockInvitationCreateCall = vi.mocked(invitationCreateCall);

const csv = (body: string, name = "users.csv") => new File([body], name, { type: "text/csv" });

const VALID_CSV = "user_email,user_role\nnew.hire@example.com,internal_user\n";

const open = async (teams: { team_id: string }[] = []) => {
  const user = userEvent.setup();
  renderWithProviders(<BulkCreateUsersButton accessToken="test-token" teams={teams} possibleUIRoles={null} />);
  await user.click(screen.getByRole("button", { name: "+ 批量邀请用户" }));
  return user;
};

const upload = (file: File) => {
  fireEvent.change(screen.getByLabelText(/将 CSV 文件拖放到此处/), { target: { files: [file] } });
};

describe("BulkCreateUsersButton Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    mockUserCreateCall.mockResolvedValue({ key: "sk-1", user_id: "u1" });
    mockInvitationCreateCall.mockResolvedValue({ id: "inv-1" });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the template and upload steps in Chinese and hides the English originals", async () => {
    await open();

    expect(screen.getByText("批量邀请用户")).toBeInTheDocument();
    expect(screen.queryByText("Bulk Invite Users")).not.toBeInTheDocument();
    expect(screen.getByText("下载并填写模板")).toBeInTheDocument();
    expect(screen.queryByText("Download and fill the template")).not.toBeInTheDocument();
    expect(screen.getByText("按照以下步骤一次添加多个用户：")).toBeInTheDocument();
    expect(screen.queryByText("Add multiple users at once by following these steps:")).not.toBeInTheDocument();
    expect(screen.getByText("下载我们的 CSV 模板")).toBeInTheDocument();
    expect(screen.queryByText("Download our CSV template")).not.toBeInTheDocument();
    expect(screen.getByText("将用户信息添加到表格中")).toBeInTheDocument();
    expect(screen.queryByText("Add your users' information to the spreadsheet")).not.toBeInTheDocument();
    expect(screen.getByText("保存文件并在此上传")).toBeInTheDocument();
    expect(screen.queryByText("Save the file and upload it here")).not.toBeInTheDocument();
    expect(screen.getByText("创建完成后，下载包含每个用户 Virtual Key 的结果文件")).toBeInTheDocument();
    expect(
      screen.queryByText("After creation, download the results file containing the Virtual Keys for each user"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("模板列名")).toBeInTheDocument();
    expect(screen.queryByText("Template Column Names")).not.toBeInTheDocument();
    expect(screen.getByText("用户的邮箱地址（必填）")).toBeInTheDocument();
    expect(screen.queryByText("User's email address (required)")).not.toBeInTheDocument();
    expect(screen.getByText('以逗号分隔的团队 ID（例如 "team-1,team-2"）')).toBeInTheDocument();
    expect(screen.getByText('以数字表示的最大预算（例如 "100"）')).toBeInTheDocument();
    expect(screen.getByText('预算重置周期（例如 "30d"、"1mo"）')).toBeInTheDocument();
    expect(screen.getByText('以逗号分隔的允许模型（例如 "gpt-3.5-turbo,gpt-4"）')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载 CSV 模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download CSV Template" })).not.toBeInTheDocument();
    expect(screen.getByText("上传填写好的 CSV")).toBeInTheDocument();
    expect(screen.queryByText("Upload your completed CSV")).not.toBeInTheDocument();
    expect(screen.getByText("将 CSV 文件拖放到此处")).toBeInTheDocument();
    expect(screen.queryByText("Drag and drop your CSV file here")).not.toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(screen.queryByText("or")).not.toBeInTheDocument();
    expect(screen.getByText("浏览文件")).toBeInTheDocument();
    expect(screen.queryByText("Browse files")).not.toBeInTheDocument();
    expect(screen.getByText("仅支持 CSV 文件（.csv）")).toBeInTheDocument();
    expect(screen.queryByText("Only CSV files (.csv) are supported")).not.toBeInTheDocument();
  });

  it("renders the invalid file type messages in Chinese and hides the English originals", async () => {
    await open();

    upload(new File(["nope"], "notes.txt", { type: "text/plain" }));

    expect(await screen.findByText("文件类型无效：notes.txt。请上传 CSV 文件（.csv 扩展名）。")).toBeInTheDocument();
    expect(
      screen.queryByText("Invalid file type: notes.txt. Please upload a CSV file (.csv extension)."),
    ).not.toBeInTheDocument();
    expect(vi.mocked(toast.fromError)).toHaveBeenCalledWith("文件类型无效。请上传 CSV 文件。");
  });

  it("renders the file-too-large message in Chinese and hides the English original", async () => {
    await open();

    const large = csv(VALID_CSV, "big.csv");
    Object.defineProperty(large, "size", { value: 6 * 1024 * 1024 });
    upload(large);

    expect(await screen.findByText("文件过大（6.0 MB）。请上传小于 5MB 的 CSV 文件。")).toBeInTheDocument();
    expect(
      screen.queryByText("File is too large (6.0 MB). Please upload a CSV file smaller than 5MB."),
    ).not.toBeInTheDocument();
  });

  it("renders the header-only and missing-column structure errors in Chinese and hides the English originals", async () => {
    await open();

    upload(csv("user_email,user_role", "headers.csv"));

    expect(await screen.findByText("CSV 文件只包含表头，没有用户数据。请向 CSV 中添加用户数据。")).toBeInTheDocument();
    expect(
      screen.queryByText("The CSV file only contains headers but no user data. Please add user data to your CSV."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("CSV 结构错误")).toBeInTheDocument();
    expect(screen.queryByText("CSV Structure Error")).not.toBeInTheDocument();
    expect(screen.getByText("请下载我们的模板，并确保你的 CSV 符合所需格式。")).toBeInTheDocument();
    expect(
      screen.queryByText("Please download our template and ensure your CSV follows the required format."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("renders the missing-columns error in Chinese and hides the English original", async () => {
    await open();

    upload(csv("user_email\nnew.hire@example.com\n", "missing.csv"));

    expect(
      await screen.findByText("你的 CSV 缺少以下必填列：user_role。请将这些列添加到 CSV 文件中。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your CSV is missing these required columns: user_role. Please add these columns to your CSV file.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the row validation errors in Chinese and hides the English originals", async () => {
    await open([{ team_id: "team-1" }]);

    upload(
      csv(
        "user_email,user_role,max_budget,budget_duration,teams\n" +
          "new.hire@example.com,internal_user,,,,\n" +
          ",bad_role,abc,xx,unknown-team\n",
        "mixed.csv",
      ),
    );

    expect(await screen.findByText("在 2 行中发现 1 行有错误。请先修正后再继续。")).toBeInTheDocument();
    expect(
      screen.queryByText("Found 1 row(s) with errors out of 2 total rows. Please correct them before proceeding."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("查看下表以了解每一行的具体错误")).toBeInTheDocument();
    expect(screen.queryByText("Check the table below for specific errors in each row")).not.toBeInTheDocument();
    expect(screen.getByText("常见问题包括邮箱格式无效、缺少必填字段或角色值不正确")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Common issues include invalid email formats, missing required fields, or incorrect role values",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("在 CSV 文件中修复这些问题后重新上传")).toBeInTheDocument();
    expect(screen.queryByText("Fix these issues in your CSV file and upload again")).not.toBeInTheDocument();
    expect(screen.getByText("无效")).toBeInTheDocument();
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
    expect(screen.getByText(/邮箱为必填项/)).toBeInTheDocument();
    expect(screen.getByText(/角色 "bad_role" 无效。必须是以下之一：/)).toBeInTheDocument();
    expect(screen.getByText(/最大预算 "abc" 必须是数字/)).toBeInTheDocument();
    expect(
      screen.getByText(/预算重置周期格式 "xx" 无效。请使用类似 "30d"、"1mo"、"2w"、"6h" 的格式/),
    ).toBeInTheDocument();
    expect(screen.getByText(/未知团队：unknown-team/)).toBeInTheDocument();
  });

  it("renders the review step and table headers in Chinese and hides the English originals", async () => {
    await open();

    upload(csv(VALID_CSV));

    expect(await screen.findByText("检查并创建用户")).toBeInTheDocument();
    expect(screen.queryByText("Review and create users")).not.toBeInTheDocument();
    expect(screen.getByText("用户预览")).toBeInTheDocument();
    expect(screen.queryByText("User Preview")).not.toBeInTheDocument();
    expect(screen.getByText("1 个用户中有 1 个有效")).toBeInTheDocument();
    expect(screen.queryByText("1 of 1 users valid")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "返回" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Back" })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "创建 1 个用户" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Create 1 Users" })).toHaveLength(0);
    expect(screen.getByRole("columnheader", { name: "行" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "邮箱" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "团队" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "预算" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "状态" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.getByText("待处理")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("成功解析 1 个用户");
  });

  it("renders the pagination controls in Chinese and hides the English originals", async () => {
    await open();

    const rows = Array.from({ length: 6 }, (_, index) => `user${index}@example.com,internal_user`).join("\n");
    upload(csv(`user_email,user_role\n${rows}\n`));

    expect(await screen.findByText("第 1 页，共 2 页")).toBeInTheDocument();
    expect(screen.queryByText("Page 1 of 2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders the creation results in Chinese and hides the English originals", async () => {
    const user = await open();
    upload(csv(VALID_CSV));

    await user.click((await screen.findAllByRole("button", { name: "创建 1 个用户" }))[0]);

    expect(await screen.findByText("用户创建结果")).toBeInTheDocument();
    expect(screen.queryByText("User Creation Results")).not.toBeInTheDocument();
    expect(screen.getByText("创建摘要")).toBeInTheDocument();
    expect(screen.queryByText("Creation Summary")).not.toBeInTheDocument();
    expect(screen.getByText("成功 1 个")).toBeInTheDocument();
    expect(screen.queryByText("1 Successful")).not.toBeInTheDocument();
    expect(screen.getByText("成功")).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
    expect(screen.getByText("用户创建完成")).toBeInTheDocument();
    expect(screen.queryByText("User creation complete")).not.toBeInTheDocument();
    expect(screen.getByText("下一步：")).toBeInTheDocument();
    expect(screen.getByText(/下载包含 Virtual Key 和邀请链接的凭据文件/)).toBeInTheDocument();
    expect(screen.queryByText(/Download the credentials file containing Virtual Keys/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始新的批量导入" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start New Bulk Import" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载用户凭据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download User Credentials" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复制" }));

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("邀请链接已复制！");
  });

  it("renders the failed-creation copy in Chinese and hides the English originals", async () => {
    mockUserCreateCall.mockResolvedValue({});
    const user = await open();
    upload(csv(VALID_CSV));

    await user.click((await screen.findAllByRole("button", { name: "创建 1 个用户" }))[0]);

    expect(await screen.findByText("失败 1 个")).toBeInTheDocument();
    expect(screen.queryByText("1 Failed")).not.toBeInTheDocument();
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
    expect(screen.getByText(/"创建用户失败"/)).toBeInTheDocument();
  });

  it("keeps the generated invitation link in the results", async () => {
    const user = await open();
    upload(csv(VALID_CSV));

    await user.click((await screen.findAllByRole("button", { name: "创建 1 个用户" }))[0]);

    await waitFor(() => {
      expect(screen.getByText(/invitation_id=inv-1/)).toBeInTheDocument();
    });
  });

  it("renders the user_role column description in Chinese and hides the English original", async () => {
    await open();

    expect(
      screen.getByText(
        '用户的角色（取值为："proxy_admin"、"proxy_admin_viewer"、"internal_user"、"internal_user_viewer" 之一）',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'User\'s role (one of: "proxy_admin", "proxy_admin_viewer", "internal_user", "internal_user_viewer")',
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the email and role validation messages in Chinese and hides the English originals", async () => {
    await open();

    upload(csv("user_email,user_role\nnotanemail,\n"));

    expect(await screen.findByText(/邮箱格式无效（必须包含 @ 和域名）/)).toBeInTheDocument();
    expect(screen.getByText(/角色为必填项/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid email format/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Role is required/)).not.toBeInTheDocument();
  });

  it("renders the positive-budget validation message in Chinese and hides the English original", async () => {
    await open();

    upload(csv("user_email,user_role,max_budget\nnew.hire@example.com,internal_user,-5\n"));

    expect(await screen.findByText(/最大预算必须大于 0/)).toBeInTheDocument();
    expect(screen.queryByText(/Max budget must be greater than 0/)).not.toBeInTheDocument();
  });

  it("renders the no-valid-users message in Chinese and hides the English original", async () => {
    await open();

    upload(csv("user_email,user_role\n,internal_user\n"));

    expect(await screen.findByText("CSV 中未找到有效用户。请检查下方错误并修复 CSV 文件。")).toBeInTheDocument();
    expect(
      screen.queryByText("No valid users found in the CSV. Please check the errors below and fix your CSV file."),
    ).not.toBeInTheDocument();
  });

  it("renders the empty-file message in Chinese and hides the English original", async () => {
    await open();

    upload(csv(""));

    expect(await screen.findByText("CSV 文件似乎是空的。请上传包含数据的文件。")).toBeInTheDocument();
    expect(
      screen.queryByText("The CSV file appears to be empty. Please upload a file with data."),
    ).not.toBeInTheDocument();
  });

  it("renders the no-headers message in Chinese and hides the English original", async () => {
    await open();

    upload(csv("\n"));

    expect(await screen.findByText("CSV 文件不包含任何列标题。请确保你的 CSV 有表头。")).toBeInTheDocument();
    expect(
      screen.queryByText("The CSV file doesn't contain any column headers. Please make sure your CSV has headers."),
    ).not.toBeInTheDocument();
  });

  it("renders the short-row message in Chinese and hides the English original", async () => {
    await open();

    upload(csv("user_email,user_role\nnew.hire@example.com\n"));

    expect(await screen.findByText("第 2 行的列数少于表头行。请确保所有数据格式正确。")).toBeInTheDocument();
    expect(
      screen.queryByText("Row 2 has fewer columns than the header row. Please ensure all data is properly formatted."),
    ).not.toBeInTheDocument();
  });

  it("renders the processing copy in Chinese and hides the English original", async () => {
    await open();

    upload(csv(VALID_CSV));

    expect(screen.getByText("处理中...")).toBeInTheDocument();
    expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
  });

  it("renders the creating copy in Chinese and hides the English original", async () => {
    mockUserCreateCall.mockReturnValue(new Promise(() => {}));
    const user = await open();
    upload(csv(VALID_CSV));

    await user.click((await screen.findAllByRole("button", { name: "创建 1 个用户" }))[0]);

    await waitFor(() => {
      expect(screen.getAllByText("创建中...").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Creating...")).not.toBeInTheDocument();
  });
});
