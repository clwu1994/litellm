import type { ParseKeys } from "i18next";

export interface GuardrailPreset {
  provider: string;
  categoryName?: string;
  nameSuggestionKey: ParseKeys<"guardrails">;
  mode: string;
  defaultOn: boolean;
}

export const GUARDRAIL_PRESETS: Record<string, GuardrailPreset> = {
  // ── LiteLLM Content Filter: Content Categories ──
  cf_denied_financial: {
    provider: "LitellmContentFilter",
    categoryName: "denied_financial_advice",
    nameSuggestionKey: "garden.presetNames.cf_denied_financial",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_legal: {
    provider: "LitellmContentFilter",
    categoryName: "denied_legal_advice",
    nameSuggestionKey: "garden.presetNames.cf_denied_legal",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_medical: {
    provider: "LitellmContentFilter",
    categoryName: "denied_medical_advice",
    nameSuggestionKey: "garden.presetNames.cf_denied_medical",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_insults: {
    provider: "LitellmContentFilter",
    categoryName: "denied_insults",
    nameSuggestionKey: "garden.presetNames.cf_denied_insults",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_violence: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_violence",
    nameSuggestionKey: "garden.presetNames.cf_harmful_violence",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_self_harm: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_self_harm",
    nameSuggestionKey: "garden.presetNames.cf_harmful_self_harm",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_child_safety: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_child_safety",
    nameSuggestionKey: "garden.presetNames.cf_harmful_child_safety",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_illegal_weapons: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_illegal_weapons",
    nameSuggestionKey: "garden.presetNames.cf_harmful_illegal_weapons",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_gender: {
    provider: "LitellmContentFilter",
    categoryName: "bias_gender",
    nameSuggestionKey: "garden.presetNames.cf_bias_gender",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_racial: {
    provider: "LitellmContentFilter",
    categoryName: "bias_racial",
    nameSuggestionKey: "garden.presetNames.cf_bias_racial",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_religious: {
    provider: "LitellmContentFilter",
    categoryName: "bias_religious",
    nameSuggestionKey: "garden.presetNames.cf_bias_religious",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_sexual_orientation: {
    provider: "LitellmContentFilter",
    categoryName: "bias_sexual_orientation",
    nameSuggestionKey: "garden.presetNames.cf_bias_sexual_orientation",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_jailbreak: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_jailbreak",
    nameSuggestionKey: "garden.presetNames.cf_prompt_injection_jailbreak",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_data_exfil: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_data_exfiltration",
    nameSuggestionKey: "garden.presetNames.cf_prompt_injection_data_exfil",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_sql: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_sql",
    nameSuggestionKey: "garden.presetNames.cf_prompt_injection_sql",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_malicious_code: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_malicious_code",
    nameSuggestionKey: "garden.presetNames.cf_prompt_injection_malicious_code",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_system_prompt: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_system_prompt",
    nameSuggestionKey: "garden.presetNames.cf_prompt_injection_system_prompt",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_toxic_abuse: {
    provider: "LitellmContentFilter",
    categoryName: "harm_toxic_abuse",
    nameSuggestionKey: "garden.presetNames.cf_toxic_abuse",
    mode: "pre_call",
    defaultOn: false,
  },

  // ── LiteLLM Content Filter: Patterns & Keywords (no category) ──
  cf_patterns: {
    provider: "LitellmContentFilter",
    nameSuggestionKey: "garden.presetNames.cf_patterns",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_keywords: {
    provider: "LitellmContentFilter",
    nameSuggestionKey: "garden.presetNames.cf_keywords",
    mode: "pre_call",
    defaultOn: false,
  },
  block_code_execution: {
    provider: "BlockCodeExecution",
    nameSuggestionKey: "garden.presetNames.block_code_execution",
    mode: "pre_call",
    defaultOn: false,
  },
  cf_competitor_intent: {
    provider: "LitellmContentFilter",
    nameSuggestionKey: "garden.presetNames.cf_competitor_intent",
    mode: "pre_call",
    defaultOn: false,
  },

  // ── Partner Guardrails ──
  presidio: {
    provider: "PresidioPII",
    nameSuggestionKey: "garden.presetNames.presidio",
    mode: "pre_call",
    defaultOn: false,
  },
  bedrock: {
    provider: "Bedrock",
    nameSuggestionKey: "garden.presetNames.bedrock",
    mode: "pre_call",
    defaultOn: false,
  },
  lakera: {
    provider: "Lakera",
    nameSuggestionKey: "garden.presetNames.lakera",
    mode: "pre_call",
    defaultOn: false,
  },
  openai_moderation: {
    provider: "OpenaiModeration",
    nameSuggestionKey: "garden.presetNames.openai_moderation",
    mode: "pre_call",
    defaultOn: false,
  },
  google_model_armor: {
    provider: "ModelArmor",
    nameSuggestionKey: "garden.presetNames.google_model_armor",
    mode: "pre_call",
    defaultOn: false,
  },
  guardrails_ai: {
    provider: "GuardrailsAi",
    nameSuggestionKey: "garden.presetNames.guardrails_ai",
    mode: "pre_call",
    defaultOn: false,
  },
  zscaler: {
    provider: "ZscalerAiGuard",
    nameSuggestionKey: "garden.presetNames.zscaler",
    mode: "pre_call",
    defaultOn: false,
  },
  panw: {
    provider: "PanwPrismaAirs",
    nameSuggestionKey: "garden.presetNames.panw",
    mode: "pre_call",
    defaultOn: false,
  },
  cisco_ai_defense: {
    provider: "CiscoAiDefense",
    nameSuggestionKey: "garden.presetNames.cisco_ai_defense",
    mode: "pre_call",
    defaultOn: false,
  },
  noma: {
    provider: "Noma",
    nameSuggestionKey: "garden.presetNames.noma",
    mode: "pre_call",
    defaultOn: false,
  },
  aporia: {
    provider: "AporiaAi",
    nameSuggestionKey: "garden.presetNames.aporia",
    mode: "pre_call",
    defaultOn: false,
  },
  aim: {
    provider: "Aim",
    nameSuggestionKey: "garden.presetNames.aim",
    mode: "pre_call",
    defaultOn: false,
  },
  cato_networks: {
    provider: "Cato Networks",
    nameSuggestionKey: "garden.presetNames.cato_networks",
    mode: "pre_call",
    defaultOn: false,
  },
  prompt_security: {
    provider: "PromptSecurity",
    nameSuggestionKey: "garden.presetNames.prompt_security",
    mode: "pre_call",
    defaultOn: false,
  },
  lasso: {
    provider: "Lasso",
    nameSuggestionKey: "garden.presetNames.lasso",
    mode: "pre_call",
    defaultOn: false,
  },
  pangea: {
    provider: "Pangea",
    nameSuggestionKey: "garden.presetNames.pangea",
    mode: "pre_call",
    defaultOn: false,
  },
  enkryptai: {
    provider: "Enkryptai",
    nameSuggestionKey: "garden.presetNames.enkryptai",
    mode: "pre_call",
    defaultOn: false,
  },
  javelin: {
    provider: "Javelin",
    nameSuggestionKey: "garden.presetNames.javelin",
    mode: "pre_call",
    defaultOn: false,
  },
  pillar: {
    provider: "Pillar",
    nameSuggestionKey: "garden.presetNames.pillar",
    mode: "pre_call",
    defaultOn: false,
  },
  akto: {
    provider: "Akto",
    nameSuggestionKey: "garden.presetNames.akto",
    mode: "pre_call",
    defaultOn: false,
  },
  promptguard: {
    provider: "Promptguard",
    nameSuggestionKey: "garden.presetNames.promptguard",
    mode: "pre_call",
    defaultOn: false,
  },
  xecguard: {
    provider: "Xecguard",
    nameSuggestionKey: "garden.presetNames.xecguard",
    mode: "pre_call",
    defaultOn: false,
  },
  deepkeep: {
    provider: "Deepkeep",
    nameSuggestionKey: "garden.presetNames.deepkeep",
    mode: "pre_call",
    defaultOn: false,
  },
  repelloai: {
    provider: "Repelloai",
    nameSuggestionKey: "garden.presetNames.repelloai",
    mode: "pre_call",
    defaultOn: false,
  },
  straiker: {
    provider: "Straiker",
    nameSuggestionKey: "garden.presetNames.straiker",
    mode: "pre_call",
    defaultOn: false,
  },
  alice: {
    provider: "Alice",
    nameSuggestionKey: "garden.presetNames.alice",
    mode: "pre_call",
    defaultOn: false,
  },
  conduct: {
    provider: "Conduct",
    nameSuggestionKey: "garden.presetNames.conduct",
    mode: "pre_call",
    defaultOn: false,
  },
};
