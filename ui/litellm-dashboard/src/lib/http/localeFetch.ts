export const LOCALE_HEADER = "Accept-Language";

const INSTALL_MARKER = "__litellmLocaleFetchInstalled";

export interface FetchHost {
  fetch: typeof fetch;
  [INSTALL_MARKER]?: boolean;
}

const headerPresent = (headers: HeadersInit | undefined, name: string): boolean => {
  if (!headers) return false;
  const target = name.toLowerCase();
  if (headers instanceof Headers) return headers.has(name);
  if (Array.isArray(headers)) return headers.some(([key]) => key.toLowerCase() === target);
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
};

const withLocaleHeader = (headers: HeadersInit | undefined, value: string): HeadersInit => {
  if (headers instanceof Headers) {
    const next = new Headers(headers);
    next.set(LOCALE_HEADER, value);
    return next;
  }
  if (Array.isArray(headers)) return [...headers, [LOCALE_HEADER, value]];
  return { ...(headers ?? {}), [LOCALE_HEADER]: value };
};

export const createLocaleFetch = (originalFetch: typeof fetch, getLocale: () => string): typeof fetch => {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const inherited = init?.headers ?? (input instanceof Request ? input.headers : undefined);
    if (headerPresent(inherited, LOCALE_HEADER)) return originalFetch(input, init);
    return originalFetch(input, { ...init, headers: withLocaleHeader(inherited, getLocale()) });
  };
};

export const installLocaleFetch = (host: FetchHost, getLocale: () => string): void => {
  if (host[INSTALL_MARKER]) return;
  host[INSTALL_MARKER] = true;
  const original = host.fetch;
  host.fetch = createLocaleFetch((input, init) => original(input, init), getLocale);
};
