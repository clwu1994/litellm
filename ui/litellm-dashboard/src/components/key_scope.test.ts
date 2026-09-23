import { describe, expect, it } from "vitest";

import { deriveKeyModelScope } from "./key_scope";

describe("deriveKeyModelScope", () => {
  it("treats unrestricted keys (null/empty allowed_routes) as full model access", () => {
    expect(deriveKeyModelScope(null)).toEqual({ hasModelAccess: true, labelKey: null });
    expect(deriveKeyModelScope(undefined)).toEqual({ hasModelAccess: true, labelKey: null });
    expect(deriveKeyModelScope([])).toEqual({ hasModelAccess: true, labelKey: null });
  });

  it("classifies SCIM keys as no model access", () => {
    expect(deriveKeyModelScope(["/scim/*"])).toEqual({ hasModelAccess: false, labelKey: "modelsCell.scope.scim" });
    expect(deriveKeyModelScope(["/scim/v2/Users", "/scim/v2/Groups"])).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.scim",
    });
  });

  it("classifies management-only keys as no model access", () => {
    expect(deriveKeyModelScope(["management_routes"])).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.management",
    });
  });

  it("classifies read-only keys as no model access", () => {
    expect(deriveKeyModelScope(["info_routes"])).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.readOnly",
    });
  });

  it("leaves LLM-API and custom scopes with model access (default rendering)", () => {
    expect(deriveKeyModelScope(["llm_api_routes"])).toEqual({ hasModelAccess: true, labelKey: null });
    expect(deriveKeyModelScope(["/chat/completions"])).toEqual({ hasModelAccess: true, labelKey: null });
    expect(deriveKeyModelScope(["management_routes", "llm_api_routes"])).toEqual({
      hasModelAccess: true,
      labelKey: null,
    });
  });

  it("prefers a persisted key_type over allowed_routes for the no-inference buckets", () => {
    expect(deriveKeyModelScope([], "management")).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.management",
    });
    expect(deriveKeyModelScope([], "read_only")).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.readOnly",
    });
    expect(deriveKeyModelScope(["some_future_mgmt_preset"], "management")).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.management",
    });
  });

  it("falls back to allowed_routes for null/default/llm_api key_type", () => {
    expect(deriveKeyModelScope(["/scim/*"], null)).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.scim",
    });
    expect(deriveKeyModelScope(["/scim/*"], "default")).toEqual({
      hasModelAccess: false,
      labelKey: "modelsCell.scope.scim",
    });
    expect(deriveKeyModelScope([], "default")).toEqual({ hasModelAccess: true, labelKey: null });
    expect(deriveKeyModelScope([], "llm_api")).toEqual({ hasModelAccess: true, labelKey: null });
  });
});
