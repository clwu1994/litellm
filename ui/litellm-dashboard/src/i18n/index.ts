import { installLocaleFetch } from "@/lib/http/localeFetch";

import i18n, { currentLocale } from "./bootstrapI18n";

export { currentLocale };
export default i18n;

if (typeof window !== "undefined") {
  installLocaleFetch(globalThis, currentLocale);
}
