import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import AwsSigV4Fields from "./AwsSigV4Fields";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

const submit = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByText("Submit"));
};

describe("AwsSigV4Fields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and docs link and hides the English originals", () => {
    renderInMcpForm(<AwsSigV4Fields />);

    expect(screen.getByText("适用于托管在 AWS Bedrock AgentCore 上的 MCP 服务器。")).toBeInTheDocument();
    expect(screen.getByText("查看文档 →")).toBeInTheDocument();
    expect(screen.queryByText("For MCP servers hosted on AWS Bedrock AgentCore.")).not.toBeInTheDocument();
    expect(screen.queryByText("View docs →")).not.toBeInTheDocument();
  });

  it("renders every Chinese AWS field label and hides the English originals", () => {
    renderInMcpForm(<AwsSigV4Fields />);

    expectPair("AWS 区域", "AWS Region");
    expectPair("AWS 服务名称", "AWS Service Name");
    expect(screen.getByText("AWS Access Key ID")).toBeInTheDocument();
    expect(screen.getByText("AWS Secret Access Key")).toBeInTheDocument();
    expect(screen.getByText("AWS Session Token")).toBeInTheDocument();
    expect(screen.getByText("AWS Role ARN")).toBeInTheDocument();
    expect(screen.getByText("AWS Session Name")).toBeInTheDocument();
  });

  it("renders the Chinese region tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS 区域",
      "用于 SigV4 签名的 AWS 区域（例如 us-east-1）",
      "AWS region for SigV4 signing (e.g., us-east-1)",
    );
  });

  it("renders the Chinese service-name tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS 服务名称",
      "用于 SigV4 签名的 AWS 服务名称。默认为 'bedrock-agentcore'。",
      "AWS service name for SigV4 signing. Defaults to 'bedrock-agentcore'.",
    );
  });

  it("renders the Chinese access-key tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS Access Key ID",
      "可选。如果未提供，则回退到 boto3 凭证链（IAM 角色、环境变量等）。",
      "Optional. If not provided, falls back to the boto3 credential chain (IAM role, env vars, etc.).",
    );
  });

  it("renders the Chinese secret-key tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS Secret Access Key",
      "可选。如果提供了 AWS Access Key ID，则为必填。",
      "Optional. Required if AWS Access Key ID is provided.",
    );
  });

  it("renders the Chinese session-token tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS Session Token",
      "可选。仅在需要临时 STS 凭证时需要。",
      "Optional. Only needed for temporary STS credentials.",
    );
  });

  it("renders the Chinese role-ARN tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS Role ARN",
      "可选。签名前通过 STS 代入的 IAM 角色 ARN。如果设置，LiteLLM 会调用 sts:AssumeRole 获取临时凭证。除非同时提供了显式密钥，否则使用环境凭证（IAM 角色、环境变量）作为源身份。",
      "Optional. IAM role ARN to assume via STS before signing. If set, LiteLLM calls sts:AssumeRole to get temporary credentials. Uses ambient credentials (IAM role, env vars) as the source identity unless explicit keys are also provided.",
    );
  });

  it("renders the Chinese session-name tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<AwsSigV4Fields />);

    await expectTooltipPair(
      user,
      "AWS Session Name",
      "可选。AssumeRole 调用的会话名称，会显示在 CloudTrail 日志中。省略时自动生成。",
      "Optional. Session name for the AssumeRole call — appears in CloudTrail logs. Auto-generated if omitted.",
    );
  });

  it("renders the Chinese prose placeholders and hides the English originals", () => {
    renderInMcpForm(<AwsSigV4Fields />);

    expect(screen.getByPlaceholderText("AKIA...（可选 — 留空则使用 IAM 角色）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入密钥（可选 — 留空则使用 IAM 角色）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入会话 Token（可选）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/MyRole（可选）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("litellm-prod（可选，留空则自动生成）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("AKIA... (optional — uses IAM role if blank)")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter secret key (optional — uses IAM role if blank)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter session token (optional)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("arn:aws:iam::123456789012:role/MyRole (optional)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("litellm-prod (optional, auto-generated if blank)")).not.toBeInTheDocument();
  });

  it("renders the Chinese region-required error once the field is emptied and hides the English original", async () => {
    renderInMcpForm(<AwsSigV4Fields />);
    const region = screen.getByPlaceholderText("us-east-1");

    fireEvent.change(region, { target: { value: "us-east-1" } });
    fireEvent.change(region, { target: { value: "" } });

    expect(await screen.findByText("SigV4 认证需要 AWS 区域")).toBeInTheDocument();
    expect(screen.queryByText("AWS region is required for SigV4 auth")).not.toBeInTheDocument();
  });

  it("renders the Chinese paired-secret error and hides the English original", async () => {
    renderInMcpForm(<AwsSigV4Fields />);

    fireEvent.change(screen.getByPlaceholderText("输入密钥（可选 — 留空则使用 IAM 角色）"), {
      target: { value: "secret" },
    });
    await submit();

    expect(await screen.findByText("提供 Secret Access Key 时，Access Key ID 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Access Key ID is required when Secret Access Key is provided")).not.toBeInTheDocument();
  });

  it("renders the Chinese paired-access-key error and hides the English original", async () => {
    renderInMcpForm(<AwsSigV4Fields />);

    fireEvent.change(screen.getByPlaceholderText("AKIA...（可选 — 留空则使用 IAM 角色）"), {
      target: { value: "AKIA123" },
    });
    await submit();

    expect(await screen.findByText("提供 Access Key ID 时，Secret Access Key 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Secret Access Key is required when Access Key ID is provided")).not.toBeInTheDocument();
  });
});
