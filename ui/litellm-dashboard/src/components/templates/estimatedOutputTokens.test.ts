import { describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import {
  estimateChecks,
  estimateFields,
  estimateRules,
  estimateTooltips,
  withNormalizedEstimates,
} from "./estimatedOutputTokens";

const t = i18n.getFixedT("en", "common");

const expectRejects = async (value: unknown) =>
  expect(estimateRules(t).perModel.validator(null, value)).rejects.toThrow(/JSON object of positive integers/);

describe("estimateFields", () => {
  it("renders a stored per-model map as editable JSON text", () => {
    expect(
      estimateFields({
        default_estimated_output_tokens: 2048,
        default_estimated_output_tokens_per_model: { "gpt-4": 4096 },
      }),
    ).toEqual({
      default_estimated_output_tokens: 2048,
      default_estimated_output_tokens_per_model: '{"gpt-4":4096}',
    });
  });

  it("leaves the controls blank when metadata carries neither setting", () => {
    expect(estimateFields({ unrelated: true })).toEqual({
      default_estimated_output_tokens: undefined,
      default_estimated_output_tokens_per_model: "",
    });
  });

  it("tolerates absent metadata", () => {
    expect(estimateFields(null).default_estimated_output_tokens_per_model).toBe("");
    expect(estimateFields(undefined).default_estimated_output_tokens_per_model).toBe("");
  });
});

describe("estimateRules.perModel", () => {
  it("accepts a blank control", async () => {
    await expect(estimateRules(t).perModel.validator(null, "")).resolves.toBeUndefined();
    await expect(estimateRules(t).perModel.validator(null, "   ")).resolves.toBeUndefined();
    await expect(estimateRules(t).perModel.validator(null, undefined)).resolves.toBeUndefined();
  });

  it("accepts a per-model object", async () => {
    await expect(estimateRules(t).perModel.validator(null, '{"gpt-4": 4096}')).resolves.toBeUndefined();
  });

  it("rejects text that is not JSON", async () => {
    await expectRejects("gpt-4: 4096");
  });

  it("rejects JSON that is not an object, which the API would refuse", async () => {
    await expectRejects("4096");
    await expectRejects('"gpt-4"');
    await expectRejects("[4096]");
    await expectRejects("null");
  });

  it("rejects a per-model map whose values the runtime would ignore", async () => {
    await expectRejects('{"gpt-4": -5}');
    await expectRejects('{"gpt-4": 0}');
    await expectRejects('{"gpt-4": 4.5}');
    await expectRejects('{"gpt-4": "4096"}');
    await expectRejects("{}");
  });
});

describe("withNormalizedEstimates", () => {
  it("coerces the numeric control and parses the per-model control without mutating the input", () => {
    const values = {
      default_estimated_output_tokens: "2048",
      default_estimated_output_tokens_per_model: '{"gpt-4": 4096}',
      other: "untouched",
    };
    const before = { ...values };

    expect(withNormalizedEstimates(values)).toEqual({
      default_estimated_output_tokens: 2048,
      default_estimated_output_tokens_per_model: { "gpt-4": 4096 },
      other: "untouched",
    });
    expect(values).toEqual(before);
  });

  it("drops blank controls so a save never sends an empty value", () => {
    expect(
      withNormalizedEstimates({
        default_estimated_output_tokens: "",
        default_estimated_output_tokens_per_model: "   ",
      }),
    ).toEqual({});
  });

  it("drops each control independently", () => {
    expect(
      withNormalizedEstimates({
        default_estimated_output_tokens: 900,
        default_estimated_output_tokens_per_model: "",
      }),
    ).toEqual({ default_estimated_output_tokens: 900 });
  });

  it("drops a per-model map the API would reject rather than sending it", () => {
    expect(
      withNormalizedEstimates({
        default_estimated_output_tokens_per_model: '{"gpt-4": -5}',
      }),
    ).toEqual({});
  });
});

describe("estimateRules.positive", () => {
  it("accepts a blank control and a positive integer", async () => {
    await expect(estimateRules(t).positive.validator(null, "")).resolves.toBeUndefined();
    await expect(estimateRules(t).positive.validator(null, 2048)).resolves.toBeUndefined();
  });

  it("rejects values the runtime would ignore", async () => {
    await expect(estimateRules(t).positive.validator(null, 0)).rejects.toThrow(/positive integer/);
    await expect(estimateRules(t).positive.validator(null, -5)).rejects.toThrow(/positive integer/);
    await expect(estimateRules(t).positive.validator(null, 12.5)).rejects.toThrow(/positive integer/);
  });
});

describe("estimate helper Chinese copy", () => {
  const zh = i18n.getFixedT("zh", "common");

  it("produces the Chinese validation messages and hides the English", () => {
    expect(estimateChecks(zh).perModel.message).toBe('输入由正整数组成的 JSON 对象，例如 {"gpt-4": 4096}');
    expect(estimateChecks(zh).positive.message).toBe("输入一个正整数");
    expect(estimateChecks(t).perModel.message).toBe('Enter a JSON object of positive integers, e.g. {"gpt-4": 4096}');
    expect(estimateChecks(t).positive.message).toBe("Enter a positive integer");
  });

  it("produces the Chinese tooltips for each entity and hides the English", () => {
    expect(estimateTooltips(zh, true, "key").estimate).toBe(
      "当请求省略 max_tokens 时，为 TPM 限制预留的预计输出 Token 数。会覆盖此密钥的内置预估。",
    );
    expect(estimateTooltips(zh, true, "team").estimate).toBe(
      "当请求省略 max_tokens 时，为 TPM 限制预留的预计输出 Token 数。会覆盖此团队的内置预估。",
    );
    expect(estimateTooltips(zh, true, "key").perModel).toBe(
      "当请求省略 max_tokens 时，为 TPM 限制预留的按模型预计输出 Token 数。优先于此密钥级别的预估。",
    );
    expect(estimateTooltips(zh, true, "team").perModel).toBe(
      "当请求省略 max_tokens 时，为 TPM 限制预留的按模型预计输出 Token 数。优先于此团队级别的预估。",
    );
    expect(estimateTooltips(zh, false).estimate).toBe(
      "只有 Proxy 管理员可以修改此项。它设置当请求省略 max_tokens 时，速率限制器为该请求预留的输出 Token 数，该数量会计入团队和组织的 TPM 窗口。",
    );
    expect(estimateTooltips(t, true, "key").estimate).toBe(
      "Expected output tokens reserved for TPM limiting when a request omits max_tokens. Overrides the built-in estimate for this key.",
    );
  });
});
