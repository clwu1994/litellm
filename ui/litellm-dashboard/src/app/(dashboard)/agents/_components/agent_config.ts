/**
 * Shared configuration for agent form fields
 * Used across create, view, and update operations
 */

import type { ParseKeys, TFunction } from "i18next";

export interface FieldConfig {
  name: string;
  label?: string;
  labelKey?: ParseKeys<"agents">;
  type: "text" | "textarea" | "url" | "switch" | "list" | "select";
  required?: boolean;
  tooltip?: string;
  tooltipKey?: ParseKeys<"agents">;
  placeholder?: string;
  placeholderKey?: ParseKeys<"agents">;
  defaultValue?: any;
  rows?: number;
  validation?: any[];
  options?: string[];
  helpText?: string;
  helpTextKey?: ParseKeys<"agents">;
}

export interface SectionConfig {
  key: string;
  title?: string;
  titleKey?: ParseKeys<"agents">;
  fields: FieldConfig[];
  defaultExpanded?: boolean;
}

export const sectionTitle = (section: SectionConfig, t: TFunction<"agents">): string =>
  section.titleKey ? t(section.titleKey) : section.title ?? "";

export const fieldLabel = (field: Pick<FieldConfig, "label" | "labelKey">, t: TFunction<"agents">): string =>
  field.labelKey ? t(field.labelKey) : field.label ?? "";

export const fieldTooltip = (
  field: Pick<FieldConfig, "tooltip" | "tooltipKey">,
  t: TFunction<"agents">,
): string | undefined => (field.tooltipKey ? t(field.tooltipKey) : field.tooltip);

export const fieldPlaceholder = (
  field: Pick<FieldConfig, "placeholder" | "placeholderKey">,
  t: TFunction<"agents">,
): string | undefined => (field.placeholderKey ? t(field.placeholderKey) : field.placeholder);

export const fieldHelpText = (
  field: Pick<FieldConfig, "helpText" | "helpTextKey">,
  t: TFunction<"agents">,
): string | undefined => (field.helpTextKey ? t(field.helpTextKey) : field.helpText);

export const AGENT_FORM_CONFIG: {
  basic: SectionConfig;
  skills: SectionConfig;
  capabilities: SectionConfig;
  optional: SectionConfig;
  litellm: SectionConfig;
  cost: SectionConfig;
  tracing: SectionConfig;
} = {
  basic: {
    key: "basic",
    titleKey: "form.panels.basicRequired",
    defaultExpanded: true,
    fields: [
      {
        name: "name",
        labelKey: "info.fields.displayName",
        type: "text",
        required: true,
        placeholderKey: "form.basic.displayNamePlaceholder",
      },
      {
        name: "description",
        labelKey: "info.fields.description",
        type: "textarea",
        required: true,
        placeholderKey: "form.descriptionPlaceholder",
        rows: 3,
      },
      {
        name: "url",
        labelKey: "info.fields.url",
        type: "url",
        required: false,
        placeholder: "http://localhost:9999/",
        tooltipKey: "form.basic.urlTooltip",
      },
      {
        name: "version",
        labelKey: "info.fields.version",
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
      },
      {
        name: "protocolVersion",
        labelKey: "info.fields.protocolVersion",
        type: "select",
        options: ["1.0", "0.3"],
        defaultValue: "1.0",
        tooltipKey: "form.basic.protocolVersionTooltip",
        helpTextKey: "form.basic.protocolVersionHelp",
      },
    ],
  },
  skills: {
    key: "skills",
    titleKey: "info.skills.title",
    fields: [
      {
        name: "skills",
        type: "list",
        defaultValue: [],
      },
    ],
  },
  capabilities: {
    key: "capabilities",
    titleKey: "form.panels.capabilities",
    fields: [
      {
        name: "streaming",
        labelKey: "info.fields.streaming",
        type: "switch",
        defaultValue: false,
      },
      {
        name: "pushNotifications",
        labelKey: "info.fields.pushNotifications",
        type: "switch",
      },
      {
        name: "stateTransitionHistory",
        labelKey: "info.fields.stateTransitionHistory",
        type: "switch",
      },
    ],
  },
  optional: {
    key: "optional",
    titleKey: "form.panels.optional",
    fields: [
      {
        name: "iconUrl",
        labelKey: "info.fields.iconUrl",
        type: "url",
        placeholder: "https://example.com/icon.png",
      },
      {
        name: "documentationUrl",
        labelKey: "info.fields.documentationUrl",
        type: "url",
        placeholder: "https://docs.example.com",
      },
      {
        name: "supportsAuthenticatedExtendedCard",
        labelKey: "form.optional.supportsAuthenticatedExtendedCard",
        type: "switch",
      },
    ],
  },
  litellm: {
    key: "litellm",
    titleKey: "form.panels.litellm",
    fields: [
      {
        name: "model",
        labelKey: "form.litellm.model",
        type: "text",
      },
      {
        name: "make_public",
        labelKey: "info.fields.makePublic",
        type: "switch",
      },
    ],
  },
  cost: {
    key: "cost",
    titleKey: "cost.title",
    fields: [
      {
        name: "cost_per_query",
        labelKey: "form.costFields.costPerQuery",
        type: "text",
        placeholder: "0.0",
        tooltipKey: "form.costFields.costPerQueryTooltip",
      },
      {
        name: "input_cost_per_token",
        labelKey: "form.costFields.inputCostPerToken",
        type: "text",
        placeholder: "0.000001",
        tooltipKey: "form.costFields.inputCostPerTokenTooltip",
      },
      {
        name: "output_cost_per_token",
        labelKey: "form.costFields.outputCostPerToken",
        type: "text",
        placeholder: "0.000002",
        tooltipKey: "form.costFields.outputCostPerTokenTooltip",
      },
    ],
  },
  tracing: {
    key: "tracing",
    title: "Tracing",
    fields: [
      {
        name: "enable_tracing",
        label: "Enable Tracing",
        type: "switch",
        defaultValue: false,
        tooltip: "Enable request tracing for this agent",
      },
    ],
  },
};

export interface SkillFieldConfig {
  name: string;
  labelKey: ParseKeys<"agents">;
  required?: boolean;
  placeholder?: string;
  placeholderKey?: ParseKeys<"agents">;
  rows?: number;
}

export const SKILL_FIELD_CONFIG: Record<"id" | "name" | "description" | "tags" | "examples", SkillFieldConfig> = {
  id: {
    name: "id",
    labelKey: "form.skillFields.id",
    required: true,
    placeholder: "e.g., hello_world",
  },
  name: {
    name: "name",
    labelKey: "form.skillFields.name",
    required: true,
    placeholderKey: "form.skillFields.namePlaceholder",
  },
  description: {
    name: "description",
    labelKey: "info.fields.description",
    required: true,
    placeholderKey: "form.skillFields.descriptionPlaceholder",
    rows: 2,
  },
  tags: {
    name: "tags",
    labelKey: "form.skillFields.tags",
    required: true,
    placeholderKey: "form.skillFields.tagsPlaceholder",
  },
  examples: {
    name: "examples",
    labelKey: "form.skillFields.examples",
    placeholderKey: "form.skillFields.examplesPlaceholder",
  },
};

/**
 * Get default form values from configuration
 */
export const getDefaultFormValues = () => {
  const defaults: any = {
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  };

  Object.values(AGENT_FORM_CONFIG).forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });

  return defaults;
};

/**
 * Build agent data from form values according to AgentConfig spec
 */
export const buildAgentDataFromForm = (values: any, existingAgent?: any) => {
  const agentData: any = {
    agent_name: values.agent_name,
    agent_card_params: {
      protocolVersion: values.protocolVersion || "1.0",
      name: values.name || values.agent_name,
      description: values.description || "",
      url: values.url || "",
      version: values.version || "1.0.0",
      defaultInputModes: existingAgent?.agent_card_params?.defaultInputModes || ["text"],
      defaultOutputModes: existingAgent?.agent_card_params?.defaultOutputModes || ["text"],
      capabilities: {
        streaming: values.streaming === true,
        ...(values.pushNotifications !== undefined && { pushNotifications: values.pushNotifications }),
        ...(values.stateTransitionHistory !== undefined && { stateTransitionHistory: values.stateTransitionHistory }),
      },
      skills: values.skills || [],
      ...(values.iconUrl && { iconUrl: values.iconUrl }),
      ...(values.documentationUrl && { documentationUrl: values.documentationUrl }),
      ...(values.supportsAuthenticatedExtendedCard !== undefined && {
        supportsAuthenticatedExtendedCard: values.supportsAuthenticatedExtendedCard,
      }),
    },
  };

  const params: Record<string, any> = {};

  if (values.model) params.model = values.model;
  if (values.make_public !== undefined) params.make_public = values.make_public;
  if (values.cost_per_query) params.cost_per_query = parseFloat(values.cost_per_query);
  if (values.input_cost_per_token) params.input_cost_per_token = parseFloat(values.input_cost_per_token);
  if (values.output_cost_per_token) params.output_cost_per_token = parseFloat(values.output_cost_per_token);

  if (Object.keys(params).length > 0) {
    agentData.litellm_params = params;
  }

  if (values.tpm_limit != null) agentData.tpm_limit = values.tpm_limit;
  if (values.rpm_limit != null) agentData.rpm_limit = values.rpm_limit;
  if (values.session_tpm_limit != null) agentData.session_tpm_limit = values.session_tpm_limit;
  if (values.session_rpm_limit != null) agentData.session_rpm_limit = values.session_rpm_limit;
  // static_headers: convert [{header, value}, ...] → {header: value, ...}
  if (Array.isArray(values.static_headers) && values.static_headers.length > 0) {
    const staticHeaders: Record<string, string> = {};
    values.static_headers.forEach((entry: { header?: string; value?: string }) => {
      const key = entry?.header?.trim();
      if (key) staticHeaders[key] = entry?.value ?? "";
    });
    if (Object.keys(staticHeaders).length > 0) {
      agentData.static_headers = staticHeaders;
    }
  }

  // extra_headers: already an array of strings from Select tags
  if (Array.isArray(values.extra_headers) && values.extra_headers.length > 0) {
    agentData.extra_headers = values.extra_headers;
  }

  return agentData;
};

export const parseMcpPermissionsForForm = (agent: any) => ({
  allowed_mcp_servers_and_groups: {
    servers: agent.object_permission?.mcp_servers ?? [],
    accessGroups: agent.object_permission?.mcp_access_groups ?? [],
    toolsets: agent.object_permission?.mcp_toolsets ?? [],
  },
  mcp_tool_permissions: agent.object_permission?.mcp_tool_permissions ?? {},
});

/**
 * Always includes every MCP key (empty when cleared) so removals persist;
 * the proxy merges object_permission per key, leaving non-MCP grants untouched.
 */
export const buildMcpObjectPermission = (values: any) => ({
  mcp_servers: values.allowed_mcp_servers_and_groups?.servers ?? [],
  mcp_access_groups: values.allowed_mcp_servers_and_groups?.accessGroups ?? [],
  mcp_toolsets: values.allowed_mcp_servers_and_groups?.toolsets ?? [],
  mcp_tool_permissions: values.mcp_tool_permissions ?? {},
});

/**
 * Parse agent data for form fields
 */
export const parseAgentForForm = (agent: any) => {
  const skills =
    agent.agent_card_params?.skills?.map((skill: any) => ({
      ...skill,
      tags: skill.tags,
      examples: skill.examples || [],
    })) || [];

  return {
    agent_name: agent.agent_name,
    name: agent.agent_card_params?.name,
    description: agent.agent_card_params?.description,
    url: agent.agent_card_params?.url,
    version: agent.agent_card_params?.version,
    protocolVersion: agent.agent_card_params?.protocolVersion,
    streaming: agent.agent_card_params?.capabilities?.streaming,
    pushNotifications: agent.agent_card_params?.capabilities?.pushNotifications,
    stateTransitionHistory: agent.agent_card_params?.capabilities?.stateTransitionHistory,
    skills: skills,
    iconUrl: agent.agent_card_params?.iconUrl,
    documentationUrl: agent.agent_card_params?.documentationUrl,
    supportsAuthenticatedExtendedCard: agent.agent_card_params?.supportsAuthenticatedExtendedCard,
    model: agent.litellm_params?.model,
    make_public: agent.litellm_params?.make_public,
    cost_per_query: agent.litellm_params?.cost_per_query,
    input_cost_per_token: agent.litellm_params?.input_cost_per_token,
    output_cost_per_token: agent.litellm_params?.output_cost_per_token,
    tpm_limit: agent.tpm_limit,
    rpm_limit: agent.rpm_limit,
    session_tpm_limit: agent.session_tpm_limit,
    session_rpm_limit: agent.session_rpm_limit,
    // static_headers: {key: value} → [{header, value}, ...]
    static_headers: agent.static_headers
      ? Object.entries(agent.static_headers as Record<string, string>).map(([header, value]) => ({
          header,
          value,
        }))
      : [],
    // extra_headers: already an array of strings
    extra_headers: agent.extra_headers ?? [],
    ...parseMcpPermissionsForForm(agent),
  };
};
