import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import PiiConfiguration from "./pii_configuration";

describe("PiiConfiguration", () => {
  it("should render", () => {
    render(
      <PiiConfiguration
        entities={[]}
        actions={[]}
        selectedEntities={[]}
        selectedActions={{}}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityCategories={[]}
      />,
    );
    expect(screen.getByText("Configure PII Protection")).toBeInTheDocument();
  });
});

describe("PiiConfiguration Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese PII protection heading and selected count and hides the English ones", () => {
    render(
      <PiiConfiguration
        entities={["PERSON", "EMAIL"]}
        actions={["MASK", "BLOCK"]}
        selectedEntities={["PERSON", "EMAIL"]}
        selectedActions={{ PERSON: "MASK", EMAIL: "BLOCK" }}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityCategories={[]}
      />,
    );

    expect(screen.getByText("配置 PII 保护")).toBeInTheDocument();
    expect(screen.getByText("已选择 2 项")).toBeInTheDocument();
    expect(screen.queryByText("Configure PII Protection")).not.toBeInTheDocument();
    expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
  });
});
