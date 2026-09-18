import type zhAuth from "./locales/zh/auth.json";
import type zhBudgets from "./locales/zh/budgets.json";
import type zhCommon from "./locales/zh/common.json";
import type zhKeys from "./locales/zh/keys.json";
import type zhNav from "./locales/zh/nav.json";
import type zhOrganizations from "./locales/zh/organizations.json";
import type zhTeams from "./locales/zh/teams.json";
import type zhUsers from "./locales/zh/users.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      nav: typeof zhNav;
      auth: typeof zhAuth;
      budgets: typeof zhBudgets;
      keys: typeof zhKeys;
      teams: typeof zhTeams;
      users: typeof zhUsers;
      organizations: typeof zhOrganizations;
    };
  }
}
