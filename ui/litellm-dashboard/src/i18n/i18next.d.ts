import type zhAuth from "./locales/zh/auth.json";
import type zhBudgets from "./locales/zh/budgets.json";
import type zhCommon from "./locales/zh/common.json";
import type zhCostTracking from "./locales/zh/costTracking.json";
import type zhKeys from "./locales/zh/keys.json";
import type zhLogs from "./locales/zh/logs.json";
import type zhNav from "./locales/zh/nav.json";
import type zhOrganizations from "./locales/zh/organizations.json";
import type zhTeams from "./locales/zh/teams.json";
import type zhUsage from "./locales/zh/usage.json";
import type zhUsers from "./locales/zh/users.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      nav: typeof zhNav;
      auth: typeof zhAuth;
      budgets: typeof zhBudgets;
      costTracking: typeof zhCostTracking;
      keys: typeof zhKeys;
      logs: typeof zhLogs;
      teams: typeof zhTeams;
      users: typeof zhUsers;
      organizations: typeof zhOrganizations;
      usage: typeof zhUsage;
    };
  }
}
