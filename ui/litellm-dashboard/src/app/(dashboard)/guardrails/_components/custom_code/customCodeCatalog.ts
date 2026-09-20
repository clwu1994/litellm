import type { ParseKeys } from "i18next";

export const CODE_TEMPLATES = {
  empty: {
    nameKey: "customCode.templates.empty",
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # inputs: {texts, images, tools, tool_calls, structured_messages, model}
    # request_data: {model, user_id, team_id, end_user_id, metadata}
    # input_type: "request" or "response"
    return allow()`,
  },
  blockSSN: {
    nameKey: "customCode.templates.blockSSN",
    code: `def apply_guardrail(inputs, request_data, input_type):
    for text in inputs["texts"]:
        if regex_match(text, r"\\d{3}-\\d{2}-\\d{4}"):
            return block("SSN detected")
    return allow()`,
  },
  redactEmail: {
    nameKey: "customCode.templates.redactEmail",
    code: `def apply_guardrail(inputs, request_data, input_type):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    modified = []
    for text in inputs["texts"]:
        modified.append(regex_replace(text, pattern, "[EMAIL REDACTED]"))
    return modify(texts=modified)`,
  },
  blockSQL: {
    nameKey: "customCode.templates.blockSQL",
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "request":
        return allow()
    for text in inputs["texts"]:
        if contains_code_language(text, ["sql"]):
            return block("SQL code not allowed")
    return allow()`,
  },
  validateJSON: {
    nameKey: "customCode.templates.validateJSON",
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    
    schema = {"type": "object", "required": ["name", "value"]}
    
    for text in inputs["texts"]:
        obj = json_parse(text)
        if obj is None:
            return block("Invalid JSON response")
        if not json_schema_valid(obj, schema):
            return block("Response missing required fields")
    return allow()`,
  },
  externalAPI: {
    nameKey: "customCode.templates.externalAPI",
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # Call an external moderation API (async for non-blocking)
    for text in inputs["texts"]:
        response = await http_post(
            "https://api.example.com/moderate",
            body={"text": text, "user_id": request_data["user_id"]},
            headers={"Authorization": "Bearer YOUR_API_KEY"},
            timeout=10
        )
        
        if not response["success"]:
            # API call failed, allow by default or block
            return allow()
        
        if response["body"].get("flagged"):
            return block(response["body"].get("reason", "Content flagged"))
    
    return allow()`,
  },
} as const satisfies Record<string, { nameKey: ParseKeys<"guardrails">; code: string }>;

export const MODE_OPTION_KEYS = [
  { value: "pre_call", labelKey: "customCode.modes.preCall" },
  { value: "post_call", labelKey: "customCode.modes.postCall" },
  { value: "during_call", labelKey: "customCode.modes.duringCall" },
  { value: "logging_only", labelKey: "customCode.modes.loggingOnly" },
  { value: "pre_mcp_call", labelKey: "customCode.modes.preMcpCall" },
  { value: "post_mcp_call", labelKey: "customCode.modes.postMcpCall" },
  { value: "during_mcp_call", labelKey: "customCode.modes.duringMcpCall" },
] as const satisfies ReadonlyArray<{ value: string; labelKey: ParseKeys<"guardrails"> }>;

export const PRIMITIVES = {
  "Return Values": [
    { name: "allow()", descKey: "customCode.primitives.allow" },
    { name: "block(reason)", descKey: "customCode.primitives.block" },
    { name: "flag(reason, metadata={})", descKey: "customCode.primitives.flag" },
    { name: "modify(texts=[], images=[], tool_calls=[])", descKey: "customCode.primitives.modify" },
  ],
  "HTTP Requests (async)": [
    { name: "await http_request(url, method, headers, body)", descKey: "customCode.primitives.httpRequest" },
    { name: "await http_get(url, headers)", descKey: "customCode.primitives.httpGet" },
    { name: "await http_post(url, body, headers)", descKey: "customCode.primitives.httpPost" },
  ],
  "Regex Functions": [
    { name: "regex_match(text, pattern)", descKey: "customCode.primitives.regexMatch" },
    { name: "regex_replace(text, pattern, replacement)", descKey: "customCode.primitives.regexReplace" },
    { name: "regex_find_all(text, pattern)", descKey: "customCode.primitives.regexFindAll" },
  ],
  "JSON Functions": [
    { name: "json_parse(text)", descKey: "customCode.primitives.jsonParse" },
    { name: "json_stringify(obj)", descKey: "customCode.primitives.jsonStringify" },
    { name: "json_schema_valid(obj, schema)", descKey: "customCode.primitives.jsonSchemaValid" },
  ],
  "URL Functions": [
    { name: "extract_urls(text)", descKey: "customCode.primitives.extractUrls" },
    { name: "is_valid_url(url)", descKey: "customCode.primitives.isValidUrl" },
    { name: "all_urls_valid(text)", descKey: "customCode.primitives.allUrlsValid" },
  ],
  "Code Detection": [
    { name: "detect_code(text)", descKey: "customCode.primitives.detectCode" },
    { name: "detect_code_languages(text)", descKey: "customCode.primitives.detectCodeLanguages" },
    { name: 'contains_code_language(text, ["sql"])', descKey: "customCode.primitives.containsCodeLanguage" },
  ],
  "Text Utilities": [
    { name: "contains(text, substring)", descKey: "customCode.primitives.contains" },
    { name: "contains_any(text, [substr1, substr2])", descKey: "customCode.primitives.containsAny" },
    { name: "word_count(text)", descKey: "customCode.primitives.wordCount" },
    { name: "char_count(text)", descKey: "customCode.primitives.charCount" },
    { name: "lower(text) / upper(text) / trim(text)", descKey: "customCode.primitives.stringTransforms" },
  ],
} as const satisfies Record<string, ReadonlyArray<{ name: string; descKey: ParseKeys<"guardrails"> }>>;

export const PRIMITIVE_CATEGORY_KEYS: Record<string, ParseKeys<"guardrails">> = {
  "Return Values": "customCode.primitiveCategories.returnValues",
  "HTTP Requests (async)": "customCode.primitiveCategories.httpRequests",
  "Regex Functions": "customCode.primitiveCategories.regexFunctions",
  "JSON Functions": "customCode.primitiveCategories.jsonFunctions",
  "URL Functions": "customCode.primitiveCategories.urlFunctions",
  "Code Detection": "customCode.primitiveCategories.codeDetection",
  "Text Utilities": "customCode.primitiveCategories.textUtilities",
};
