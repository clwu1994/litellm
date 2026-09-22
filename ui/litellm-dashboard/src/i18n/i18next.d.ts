import type zhAccessGroups from "./locales/zh/accessGroups.json";
import type zhAgents from "./locales/zh/agents.json";
import type zhAuth from "./locales/zh/auth.json";
import type zhBudgets from "./locales/zh/budgets.json";
import type zhCaching from "./locales/zh/caching.json";
import type zhCommon from "./locales/zh/common.json";
import type zhCostTracking from "./locales/zh/costTracking.json";
import type zhGuardrails from "./locales/zh/guardrails.json";
import type zhGuardrailsMonitor from "./locales/zh/guardrailsMonitor.json";
import type zhKeys from "./locales/zh/keys.json";
import type zhLogs from "./locales/zh/logs.json";
import type zhMcpServers from "./locales/zh/mcpServers.json";
import type zhModels from "./locales/zh/models.json";
import type zhNav from "./locales/zh/nav.json";
import type zhOrganizations from "./locales/zh/organizations.json";
import type zhPlayground from "./locales/zh/playground.json";
import type zhPolicies from "./locales/zh/policies.json";
import type zhPrompts from "./locales/zh/prompts.json";
import type zhProjects from "./locales/zh/projects.json";
import type zhRouterSettings from "./locales/zh/routerSettings.json";
import type zhSearchTools from "./locales/zh/searchTools.json";
import type zhTagManagement from "./locales/zh/tagManagement.json";
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
      accessGroups: typeof zhAccessGroups;
      agents: typeof zhAgents;
      auth: typeof zhAuth;
      budgets: typeof zhBudgets;
      caching: typeof zhCaching;
      costTracking: typeof zhCostTracking;
      guardrails: typeof zhGuardrails;
      guardrailsMonitor: typeof zhGuardrailsMonitor;
      keys: typeof zhKeys;
      logs: typeof zhLogs;
      mcpServers: typeof zhMcpServers;
      models: typeof zhModels;
      teams: typeof zhTeams;
      users: typeof zhUsers;
      organizations: typeof zhOrganizations;
      playground: typeof zhPlayground;
      policies: typeof zhPolicies;
      prompts: typeof zhPrompts;
      projects: typeof zhProjects;
      routerSettings: typeof zhRouterSettings;
      searchTools: typeof zhSearchTools;
      tagManagement: typeof zhTagManagement;
      usage: typeof zhUsage;
      vectorStores: typeof zhVectorStores;
    };
  }
}
