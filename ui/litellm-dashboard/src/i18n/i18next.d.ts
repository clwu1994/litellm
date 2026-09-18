import type zhAuth from "./locales/zh/auth.json";
import type zhCommon from "./locales/zh/common.json";
import type zhNav from "./locales/zh/nav.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      nav: typeof zhNav;
      auth: typeof zhAuth;
    };
  }
}
