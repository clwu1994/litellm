export const ERROR_CODE_OPTIONS = [
  { labelKey: "request.filters.errorCode.codes.400", value: "400" },
  { labelKey: "request.filters.errorCode.codes.401", value: "401" },
  { labelKey: "request.filters.errorCode.codes.403", value: "403" },
  { labelKey: "request.filters.errorCode.codes.404", value: "404" },
  { labelKey: "request.filters.errorCode.codes.408", value: "408" },
  { labelKey: "request.filters.errorCode.codes.422", value: "422" },
  { labelKey: "request.filters.errorCode.codes.429", value: "429" },
  { labelKey: "request.filters.errorCode.codes.500", value: "500" },
  { labelKey: "request.filters.errorCode.codes.502", value: "502" },
  { labelKey: "request.filters.errorCode.codes.503", value: "503" },
  { labelKey: "request.filters.errorCode.codes.529", value: "529" },
] as const;

/** Call types that represent MCP tool invocations (shared across columns, index, drawer). */
export const MCP_CALL_TYPES = ["call_mcp_tool", "list_mcp_tools"];

/** Call types that represent agent/A2A requests (e.g. asend_message). */
export const AGENT_CALL_TYPES = ["asend_message"];

/** Call types that represent Batch API operations (creation and retrieval, sync and async). */
export const BATCH_CALL_TYPES = ["acreate_batch", "create_batch", "aretrieve_batch", "retrieve_batch"];

export const QUICK_SELECT_OPTIONS = [
  { labelKey: "request.toolbar.quickSelect.lastMinute", value: 1, unit: "minutes" },
  { labelKey: "request.toolbar.quickSelect.last15Minutes", value: 15, unit: "minutes" },
  { labelKey: "request.toolbar.quickSelect.lastHour", value: 1, unit: "hours" },
  { labelKey: "request.toolbar.quickSelect.last4Hours", value: 4, unit: "hours" },
  { labelKey: "request.toolbar.quickSelect.last24Hours", value: 24, unit: "hours" },
  { labelKey: "request.toolbar.quickSelect.last7Days", value: 7, unit: "days" },
] as const;
