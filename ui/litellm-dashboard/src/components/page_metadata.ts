/**
 * Page metadata for UI Settings configuration
 * This file contains descriptions and metadata for all navigation pages
 */

import type zhNav from "@/i18n/locales/zh/nav.json";

export type PageGroupKey = `section.${keyof typeof zhNav.section}`;
export type PageParentKey = `items.${keyof typeof zhNav.items}`;
export type PageDescriptionKey = `descriptions.${keyof typeof zhNav.descriptions}`;

// Page description keys for UI Settings configuration, resolved from the nav catalog at render
export const pageDescriptions: Record<string, PageDescriptionKey> = {
  "api-keys": "descriptions.apiKeys",
  "llm-playground": "descriptions.llmPlayground",
  models: "descriptions.models",
  agents: "descriptions.agents",
  agentic: "descriptions.agentic",
  workflows: "descriptions.workflows",
  "mcp-servers": "descriptions.mcpServers",
  memory: "descriptions.memory",
  guardrails: "descriptions.guardrails",
  policies: "descriptions.policies",
  "search-tools": "descriptions.searchTools",
  "tool-policies": "descriptions.toolPolicies",
  "vector-stores": "descriptions.vectorStores",
  new_usage: "descriptions.newUsage",
  "cost-optimization": "descriptions.costOptimization",
  logs: "descriptions.logs",
  "guardrails-monitor": "descriptions.guardrailsMonitor",
  users: "descriptions.users",
  teams: "descriptions.teams",
  organizations: "descriptions.organizations",
  projects: "descriptions.projects",
  "access-groups": "descriptions.accessGroups",
  budgets: "descriptions.budgets",
  api_ref: "descriptions.apiRef",
  "model-hub-table": "descriptions.modelHubTable",
  "learning-resources": "descriptions.learningResources",
  caching: "descriptions.caching",
  "transform-request": "descriptions.transformRequest",
  "cost-tracking": "descriptions.costTracking",
  "ui-theme": "descriptions.uiTheme",
  "tag-management": "descriptions.tagManagement",
  prompts: "descriptions.prompts",
  skills: "descriptions.skills",
  usage: "descriptions.usage",
  "router-settings": "descriptions.routerSettings",
  "logging-and-alerts": "descriptions.loggingAndAlerts",
  "admin-panel": "descriptions.adminPanel",
};

export interface PageMetadata {
  page: string;
  label: string;
  groupKey: PageGroupKey;
  parentKey?: PageParentKey;
  descriptionKey: PageDescriptionKey;
}
