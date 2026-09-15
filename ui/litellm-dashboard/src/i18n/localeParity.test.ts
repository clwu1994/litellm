import { describe, expect, it } from "vitest";

import { resources } from "./resources";

const flatten = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
};

const leafStrings = (value: unknown, prefix = ""): Array<{ key: string; value: string }> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [{ key: prefix, value: String(value) }];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafStrings(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("locale files", () => {
  it("define exactly the same keys in Chinese and English", () => {
    expect(flatten(resources.en).sort()).toEqual(flatten(resources.zh).sort());
  });

  it("define no empty strings", () => {
    const empties = leafStrings(resources.zh)
      .filter(({ value }) => value.trim() === "")
      .map(({ key }) => key);
    expect(empties).toEqual([]);
  });
});
