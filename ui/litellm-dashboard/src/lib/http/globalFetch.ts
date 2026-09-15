export const deferToGlobalFetch = (...args: Parameters<typeof fetch>): Promise<Response> => globalThis.fetch(...args);
