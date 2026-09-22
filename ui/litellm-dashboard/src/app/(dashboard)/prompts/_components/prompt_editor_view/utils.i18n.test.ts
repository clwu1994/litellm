import { describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { parseExistingPrompt } from "./utils";

const enT = i18n.getFixedT("en", "prompts");
const zhT = i18n.getFixedT("zh", "prompts");

const unnamedPrompt = {
  prompt_spec: {
    litellm_params: { dotprompt_content: "---\nmodel: gpt-4\n---\n\nUser: Hi" },
  },
};

const emptyBody = {
  prompt_spec: {
    litellm_params: { dotprompt_content: "---\nmodel: gpt-4\n---\n\n" },
  },
};

describe("prompt editor fallback copy", () => {
  it("names a prompt without an identifier in the active locale", () => {
    expect(parseExistingPrompt(unnamedPrompt, enT).name).toBe("Unnamed Prompt");
    expect(parseExistingPrompt(unnamedPrompt, zhT).name).toBe("未命名提示词");
  });

  it("seeds an empty prompt body in the active locale", () => {
    expect(parseExistingPrompt(emptyBody, enT).messages).toEqual([
      { role: "user", content: "Enter task specifics. Use {{template_variables}} for dynamic inputs" },
    ]);
    expect(parseExistingPrompt(emptyBody, zhT).messages).toEqual([
      { role: "user", content: "在此填写任务细节。使用 {{template_variables}} 作为动态输入" },
    ]);
  });
});
