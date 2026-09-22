import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";

import i18n from "@/i18n/bootstrapI18n";
import { useZodForm } from "@/lib/forms/useZodForm";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import MetadataKeyValueFields, { metadataPairsSchema } from "./MetadataKeyValueFields";

const harnessSchema = z.object({ metadata: metadataPairsSchema });

const Harness: React.FC = () => {
  const form = useZodForm(harnessSchema, { defaultValues: { metadata: [{ key: "department", value: "research" }] } });
  return <MetadataKeyValueFields control={form.control} getValues={form.getValues} name="metadata" />;
};

describe("MetadataKeyValueFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholders, remove label and add label and hides the English originals", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByPlaceholderText("键")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("值")).toBeInTheDocument();
    expect(screen.getByLabelText("移除键值对")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加键值对" })).toBeInTheDocument();

    expect(screen.queryByPlaceholderText("Key")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Value")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remove key-value pair")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Key-Value Pair" })).not.toBeInTheDocument();
  });
});

vi.mock("@/app/(dashboard)/hooks/teams/useTeamMetadataSchema", () => ({}));
