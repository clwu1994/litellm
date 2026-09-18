import type zhAuth from "./locales/zh/auth.json";
import type zhCommon from "./locales/zh/common.json";
import type zhKeys from "./locales/zh/keys.json";
import type zhNav from "./locales/zh/nav.json";
import type zhTeams from "./locales/zh/teams.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      nav: typeof zhNav;
      auth: typeof zhAuth;
      keys: typeof zhKeys;
      teams: typeof zhTeams;
    };
  }
}
