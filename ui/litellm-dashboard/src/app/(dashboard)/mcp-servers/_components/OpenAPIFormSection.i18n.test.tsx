import React from "react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import {
  MountedFormProvider,
  useMountRegistry,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";

import { expectTooltipPair } from "./mcpI18nTestUtils";
import OpenAPIFormSection from "./OpenAPIFormSection";

const renderSection = () => {
  const Harness: React.FC = () => {
    const form = useForm<MountedFormValues>({ mode: "onChange" });
    const registry = useMountRegistry();
    return (
      <FormProvider {...form}>
        <MountedFormProvider value={{ control: form.control, registry }}>
          <OpenAPIFormSection form={form} accessToken={null} onValuesChange={vi.fn()} />
        </MountedFormProvider>
      </FormProvider>
    );
  };
  render(<Harness />);
};

describe("OpenAPIFormSection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese spec URL label and hides the English original", () => {
    renderSection();

    expect(screen.getByText("OpenAPI Spec URL")).toBeInTheDocument();
  });

  it("renders the Chinese spec URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderSection();

    await expectTooltipPair(
      user,
      "OpenAPI Spec URL",
      "OpenAPI 规范（JSON 或 YAML）的 URL。MCP 工具将根据规范中定义的 API Endpoint 自动生成。",
      "URL to an OpenAPI specification (JSON or YAML). MCP tools will be automatically generated from the API endpoints defined in the spec.",
    );
  });

  it("renders the Chinese required error once the spec URL is emptied and hides the English original", async () => {
    renderSection();
    const specUrl = screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json");

    fireEvent.change(specUrl, { target: { value: "https://example.com/openapi.json" } });
    fireEvent.change(specUrl, { target: { value: "" } });

    expect(await screen.findByText("请输入 OpenAPI Spec URL")).toBeInTheDocument();
    expect(screen.queryByText("Please enter an OpenAPI spec URL")).not.toBeInTheDocument();
  });
});
