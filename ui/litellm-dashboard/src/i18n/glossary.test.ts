import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resources } from "./resources";

type Glossary = Record<string, string[]>;

const glossaryPath = resolve(process.cwd(), "../../i18n/glossary.json");
const glossary: Glossary = JSON.parse(readFileSync(glossaryPath, "utf-8"));

const squeeze = (value: string): string => value.replace(/\s+/g, "").toLowerCase();

const leafPairs = (): Array<{ key: string; zh: string; en: string }> => {
  const collect = (value: unknown, prefix: string): Array<{ key: string; value: string }> => {
    if (typeof value === "object" && value !== null) {
      return Object.entries(value).flatMap(([key, child]) => collect(child, prefix ? `${prefix}.${key}` : key));
    }
    return [{ key: prefix, value: String(value) }];
  };
  const en = new Map(collect(resources.en, "").map(({ key, value }) => [key, value]));
  return collect(resources.zh, "").map(({ key, value }) => ({ key, zh: value, en: en.get(key) ?? "" }));
};

describe("glossary enforcement", () => {
  it("reads the single source of truth from the repo root", () => {
    expect(Object.keys(glossary).length).toBeGreaterThan(0);
  });

  it("keeps technical terms in English in every Chinese string", () => {
    const violations: string[] = [];
    for (const { key, zh, en } of leafPairs()) {
      for (const [term, bannedList] of Object.entries(glossary)) {
        if (!squeeze(en).includes(squeeze(term))) continue;
        for (const banned of bannedList) {
          if (squeeze(zh).includes(squeeze(banned))) {
            violations.push(`${key}: ${term} must stay in English but found ${banned}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
