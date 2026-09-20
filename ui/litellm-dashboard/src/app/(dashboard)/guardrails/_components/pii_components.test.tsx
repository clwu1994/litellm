import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { CategoryFilter, QuickActions, PiiEntityList } from "./pii_components";
import type { PiiEntityCategory } from "@/components/guardrails/types";

describe("CategoryFilter", () => {
  it("should render", () => {
    const emptyCategories: PiiEntityCategory[] = [];
    render(<CategoryFilter categories={emptyCategories} selectedCategories={[]} onChange={() => {}} />);
    expect(screen.getByText("Filter by category")).toBeInTheDocument();
  });
});

describe("QuickActions", () => {
  it("should render", () => {
    render(<QuickActions onSelectAll={() => {}} onUnselectAll={() => {}} hasSelectedEntities={false} />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });
});

describe("PiiEntityList", () => {
  it("should render", () => {
    render(
      <PiiEntityList
        entities={[]}
        selectedEntities={[]}
        selectedActions={{}}
        actions={[]}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityToCategoryMap={new Map()}
      />,
    );
    expect(screen.getByText("No PII types match your filter criteria")).toBeInTheDocument();
  });
});

/* eslint-disable testing-library/no-node-access -- The tooltip trigger is an icon with no accessible name, so reaching it needs the DOM */
describe("PII components Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese category filter chrome and empty state", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CategoryFilter
        categories={[{ category: "PERSON", entities: ["PERSON"] }]}
        selectedCategories={[]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("按类别筛选")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要筛选的类别")).toBeInTheDocument();
    expect(screen.queryByText("Filter by category")).not.toBeInTheDocument();
    expect(screen.queryByText("Select categories to filter by")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择要筛选的类别"));
    await user.type(screen.getByPlaceholderText("选择要筛选的类别"), "zzz");
    expect(await screen.findByText("没有匹配的类别")).toBeInTheDocument();
    expect(screen.queryByText("No matching categories")).not.toBeInTheDocument();
  });

  it("renders the Chinese quick actions chrome and tooltip", async () => {
    const user = userEvent.setup({ delay: null });
    render(<QuickActions onSelectAll={() => {}} onUnselectAll={() => {}} hasSelectedEntities />);

    expect(screen.getByText("快捷操作")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消全选" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选并屏蔽" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选并阻止" })).toBeInTheDocument();

    const trigger = screen.getByText("快捷操作").parentElement?.querySelector("svg");
    if (!trigger) throw new Error("no quick actions hint trigger");
    await user.hover(trigger);
    expect(await screen.findByText("一次性对所有 PII 类型应用操作")).toBeInTheDocument();

    expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();
    expect(screen.queryByText("Unselect All")).not.toBeInTheDocument();
    expect(screen.queryByText("Select All & Mask")).not.toBeInTheDocument();
    expect(screen.queryByText("Select All & Block")).not.toBeInTheDocument();
  });

  it("renders the Chinese PII entity table chrome and aliases the action wire values", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(
      <PiiEntityList
        entities={["PERSON"]}
        selectedEntities={["PERSON"]}
        selectedActions={{ PERSON: "MASK" }}
        actions={["MASK", "BLOCK"]}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityToCategoryMap={new Map()}
      />,
    );

    expect(screen.getByText("PII 类型")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByText("屏蔽")).toBeInTheDocument();
    expect(screen.queryByText("MASK")).not.toBeInTheDocument();
    expect(screen.queryByText("Mask")).not.toBeInTheDocument();
    expect(screen.queryByText("PII Type")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "操作" }));
    expect(await screen.findByRole("option", { name: "阻止" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "BLOCK" })).not.toBeInTheDocument();

    unmount();
    render(
      <PiiEntityList
        entities={[]}
        selectedEntities={[]}
        selectedActions={{}}
        actions={[]}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityToCategoryMap={new Map()}
      />,
    );
    expect(screen.getByText("没有 PII 类型符合你的筛选条件")).toBeInTheDocument();
    expect(screen.queryByText("No PII types match your filter criteria")).not.toBeInTheDocument();
  });
});
