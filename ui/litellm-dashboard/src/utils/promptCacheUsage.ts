interface CachedTokenDetails {
  cached_tokens?: number | null;
  cache_write_tokens?: number | null;
}

export interface ProviderCacheUsage {
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  prompt_tokens_details?: CachedTokenDetails | null;
  input_tokens_details?: CachedTokenDetails | null;
}

export interface PromptCacheTokens {
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

const positiveTokenCount = (value: number | null | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

export const extractPromptCacheTokens = (usage: ProviderCacheUsage | null | undefined): PromptCacheTokens => {
  const details = usage?.prompt_tokens_details ?? usage?.input_tokens_details;
  const cacheReadTokens =
    positiveTokenCount(usage?.cache_read_input_tokens) ?? positiveTokenCount(details?.cached_tokens);
  const cacheCreationTokens =
    positiveTokenCount(usage?.cache_creation_input_tokens) ?? positiveTokenCount(details?.cache_write_tokens);

  return {
    ...(cacheReadTokens !== undefined && { cacheReadTokens }),
    ...(cacheCreationTokens !== undefined && { cacheCreationTokens }),
  };
};
