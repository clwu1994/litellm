import type { ParseKeys } from "i18next";

export interface ErrorPattern {
  pattern: RegExp;
  replacement: string;
  replacementKey?: ParseKeys<"common">;
}

// Centralised list of common error patterns.
// Add new patterns here without touching component files.
// The HTTP-status and litellm.* entries are shadowed: extractMeaningfulError resolves any
// "<name>Error" token or 4xx/5xx status before it walks this list, so they keep their English
// replacement and carry no key.
export const errorPatterns: ErrorPattern[] = [
  // Generic missing API key (covers OpenAI, Anthropic, etc.)
  {
    pattern: /Missing .* API Key/i,
    replacement: "Missing API Key",
    replacementKey: "errorPatterns.missingApiKey",
  },
  // Network / connectivity issues
  {
    pattern: /Connection timeout/i,
    replacement: "Connection timeout",
    replacementKey: "errorPatterns.connectionTimeout",
  },
  {
    pattern: /Network.*not.*ok/i,
    replacement: "Network connection failed",
    replacementKey: "errorPatterns.networkConnectionFailed",
  },
  // HTTP status based errors
  {
    pattern: /403.*Forbidden/i,
    replacement: "Access forbidden - check API key permissions",
  },
  {
    pattern: /401.*Unauthorized/i,
    replacement: "Unauthorized - invalid API key",
  },
  {
    pattern: /429.*rate limit/i,
    replacement: "Rate limit exceeded",
  },
  {
    pattern: /500.*Internal Server Error/i,
    replacement: "Provider internal server error",
  },
  // LiteLLM specific wrapped errors
  {
    pattern: /litellm\.AuthenticationError/i,
    replacement: "Authentication failed",
  },
  {
    pattern: /litellm\.RateLimitError/i,
    replacement: "Rate limit exceeded",
  },
  {
    pattern: /litellm\.APIError/i,
    replacement: "API error",
  },
];
