import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import TopKeyView from "./TopKeyView";

vi.mock("@/components/ui/tooltip", async () => {
  const actual = await vi.importActual<typeof import("@/components/ui/tooltip")>("@/components/ui/tooltip");
  return {
    ...actual,
    SimpleTooltip: ({ children, content }: { children?: ReactNode; content?: ReactNode }) => (
      <div>
        {children}
        <div>{content}</div>
      </div>
    ),
  };
});

vi.mock("@/components/shared/charts", () => ({
  BarChart: ({
    customTooltip,
    data,
  }: {
    customTooltip?: (props: { payload: { payload: unknown }[] }) => ReactNode;
    data?: unknown[];
  }) => (customTooltip ? <div>{customTooltip({ payload: [{ payload: data?.[0] }] })}</div> : null),
}));

vi.mock("../../../networking", () => ({
  keyInfoV1Call: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../../key_team_helpers/transform_key_info", () => ({
  transformKeyInfo: vi.fn().mockReturnValue({}),
}));

vi.mock("../../../templates/key_info_view", () => ({
  default: ({ keyId }: { keyId: string }) => <div data-testid="key-info-view">{keyId}</div>,
}));

const topKeys = [
  {
    api_key: "sk-abc",
    key_alias: "alias-1",
    spend: 12.5,
    tags: [
      { tag: "t1", usage: 1 },
      { tag: "t2", usage: 2 },
      { tag: "t3", usage: 3 },
    ],
  },
];

const renderView = () =>
  renderWithProviders(
    <TopKeyView topKeys={topKeys} teams={null} topKeysLimit={5} setTopKeysLimit={() => {}} showTags />,
  );

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en), `English "${en}" still present for zh "${zh}"`).toHaveLength(0);
};

describe("TopKeyView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese table chrome, tag tooltip and expand control", () => {
    renderView();

    expectLocalized("表格视图", "Table View");
    expectLocalized("图表视图", "Chart View");
    expectLocalized("密钥 ID", "Key ID");
    expectLocalized("密钥别名", "Key Alias");
    expectLocalized("标签", "Tags");
    expectLocalized("支出（USD）", "Spend (USD)");
    expectLocalized("标签名称：", "Tag Name:");
    expectLocalized("支出：", "Spend:");

    expect(screen.getByRole("radiogroup", { name: "要显示的 Top 密钥数量" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Number of top keys to show" })).not.toBeInTheDocument();
    expect(screen.getByTitle("显示全部标签")).toBeInTheDocument();
    expect(screen.queryByTitle("Show all tags")).not.toBeInTheDocument();
  });

  it("renders the Chinese chart tooltip labels and the collapse control", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: "图表视图" }));

    expectLocalized("密钥别名：", "Key Alias:");
    expectLocalized("密钥 ID：", "Key ID:");
    expectLocalized("支出：", "Spend:");

    await user.click(screen.getByRole("button", { name: "表格视图" }));
    await user.click(screen.getByTitle("显示全部标签"));
    expect(screen.getByTitle("收起标签")).toBeInTheDocument();
    expect(screen.queryByTitle("Show fewer tags")).not.toBeInTheDocument();
  });

  it("renders the Chinese modal close label and hides the English", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: "sk-abc" }));
    await screen.findByTestId("key-info-view");

    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
