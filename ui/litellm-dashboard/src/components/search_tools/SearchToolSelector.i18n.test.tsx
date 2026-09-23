import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { fetchSearchTools } from "../networking";
import SearchToolSelector from "./SearchToolSelector";

vi.mock("../networking", () => ({ fetchSearchTools: vi.fn() }));

const mockFetch = vi.mocked(fetchSearchTools);

describe("SearchToolSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", () => {
    renderWithProviders(<SearchToolSelector accessToken="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择搜索工具（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select search tools (optional)")).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-all control and hides the English original", () => {
    renderWithProviders(<SearchToolSelector accessToken="" value={["search-one"]} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "清除所有搜索工具" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all search tools" })).not.toBeInTheDocument();
  });

  it("renders the Chinese loading and empty states and hides the English originals", async () => {
    const user = userEvent.setup();
    mockFetch.mockReturnValue(new Promise(() => {}));
    const loading = renderWithProviders(<SearchToolSelector accessToken="token" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("正在加载搜索工具…")).toBeInTheDocument();
    expect(screen.queryByText("Loading search tools…")).not.toBeInTheDocument();
    loading.unmount();

    mockFetch.mockResolvedValue({ search_tools: [] });
    renderWithProviders(<SearchToolSelector accessToken="token" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("未找到搜索工具")).toBeInTheDocument();
    expect(screen.queryByText("No search tools found")).not.toBeInTheDocument();
  });
});
