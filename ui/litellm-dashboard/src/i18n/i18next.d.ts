import type zhAuth from "./locales/zh/auth.json";
import type zhBudgets from "./locales/zh/budgets.json";
import type zhCommon from "./locales/zh/common.json";
import type zhCostTracking from "./locales/zh/costTracking.json";
import type zhGuardrails from "./locales/zh/guardrails.json";
import type zhKeys from "./locales/zh/keys.json";
import type zhLogs from "./locales/zh/logs.json";
import type zhModels from "./locales/zh/models.json";
import type zhNav from "./locales/zh/nav.json";
import type zhOrganizations from "./locales/zh/organizations.json";
import type zhPlayground from "./locales/zh/playground.json";
import type zhPolicies from "./locales/zh/policies.json";
import type zhTeams from "./locales/zh/teams.json";
import type zhUsage from "./locales/zh/usage.json";
import type zhUsers from "./locales/zh/users.json";
import type zhVectorStores from "./locales/zh/vectorStores.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      nav: typeof zhNav;
      auth: typeof zhAuth;
      budgets: typeof zhBudgets;
      costTracking: typeof zhCostTracking;
      guardrails: typeof zhGuardrails;
      keys: typeof zhKeys;
      logs: typeof zhLogs;
      models: typeof zhModels;
      teams: typeof zhTeams;
      users: typeof zhUsers;
      organizations: typeof zhOrganizations;
      playground: typeof zhPlayground;
      policies: typeof zhPolicies;
      usage: typeof zhUsage;
      vectorStores: typeof zhVectorStores;
    };
  }
}
