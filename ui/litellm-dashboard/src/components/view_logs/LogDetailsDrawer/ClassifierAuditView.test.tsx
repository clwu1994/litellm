import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { ClassifierAuditView } from "./ClassifierAuditView";

vi.mock("./JsonViewer", () => ({
  JsonViewer: ({ data }: { data: unknown }) => <pre>{JSON.stringify(data)}</pre>,
}));

describe("ClassifierAuditView", () => {
  it("separates and copies the provider input, source request, and returned verdict", async () => {
    const user = userEvent.setup();
    const input = { system: "classification rubric", messages: [{ role: "user", content: "classify this" }] };
    render(
      <ClassifierAuditView
        request={{ classifier_input: input, originating_request_masked: { input: "source-only", api_key: "REDACTED" } }}
        response={{ tier: "SIMPLE", reason: "a greeting" }}
      />,
    );
    const classifier = within(screen.getByRole("region", { name: "Classifier input" }));
    expect(classifier.getByText(/classification rubric/)).toBeInTheDocument();
    expect(classifier.queryByText(/source-only/)).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Originating request, credentials masked" })).getByText(/source-only/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Classifier response" })).getByText(/a greeting/),
    ).toBeInTheDocument();
    await user.click(classifier.getByRole("button", { name: "Copy Classifier input" }));
    expect(await navigator.clipboard.readText()).toBe(JSON.stringify(input, null, 2));
  });

  it("does not present legacy source messages as captured classifier input", () => {
    render(<ClassifierAuditView request={{ messages: [{ content: "legacy source" }] }} response={undefined} />);
    expect(screen.getAllByText("Not captured or message logging disabled")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Copy Classifier input" })).not.toBeInTheDocument();
  });

  it("labels truncated input without marking a complete source request as truncated", () => {
    render(
      <ClassifierAuditView
        request={{
          classifier_input: { system: "partial rubric...litellm_truncated" },
          originating_request_masked: { input: "source" },
        }}
        response={{ tier: "SIMPLE" }}
      />,
    );
    expect(within(screen.getByRole("region", { name: "Classifier input" })).getByRole("status")).toHaveTextContent(
      "This stored copy is truncated",
    );
    expect(
      within(screen.getByRole("region", { name: "Originating request, credentials masked" })).queryByRole("status"),
    ).not.toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders every Chinese section title and description and hides the English ones", () => {
      render(
        <ClassifierAuditView
          request={{ classifier_input: { a: 1 }, originating_request_masked: { b: 2 } }}
          response={{ tier: "SIMPLE" }}
        />,
      );

      expect(screen.getByRole("region", { name: "分类器输入" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "原始请求，凭据已遮蔽" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "分类器响应" })).toBeInTheDocument();
      expect(screen.getByText("提供商请求载荷。缓存调用或消息日志记录被禁用时可能没有捕获内容。")).toBeInTheDocument();
      expect(screen.getByText("仅供对比。此源请求未追加到分类器输入中。")).toBeInTheDocument();
      expect(
        screen.getByText("分类器返回的判定结果及提供的任何说明。后续路由规则可能会改变层级。"),
      ).toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Classifier input" })).not.toBeInTheDocument();
      expect(
        screen.queryByText("Provider request payload. A cached call or disabled message logging may have no capture."),
      ).not.toBeInTheDocument();
    });

    it("renders the Chinese copy label and truncation notice and hides the English ones", () => {
      render(
        <ClassifierAuditView
          request={{
            classifier_input: { system: "partial...litellm_truncated" },
            originating_request_masked: { input: "source" },
          }}
          response={{ tier: "SIMPLE" }}
        />,
      );

      const classifier = within(screen.getByRole("region", { name: "分类器输入" }));
      expect(classifier.getByRole("button", { name: "复制分类器输入" })).toBeInTheDocument();
      expect(classifier.queryByRole("button", { name: "Copy Classifier input" })).not.toBeInTheDocument();
      expect(classifier.getByRole("status")).toHaveTextContent("此存储副本已被截断");
      expect(classifier.queryByText(/This stored copy is truncated/)).not.toBeInTheDocument();
    });

    it("renders the Chinese not-captured state and hides the English one", () => {
      render(<ClassifierAuditView request={{}} response={undefined} />);

      expect(screen.getAllByText("未捕获或消息日志记录已禁用")).toHaveLength(3);
      expect(screen.queryByText("Not captured or message logging disabled")).not.toBeInTheDocument();
    });
  });
});
