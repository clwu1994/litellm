import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { getAgentsList } from "../networking";
import AgentSelector from "./AgentSelector";

vi.mock("../networking", () => ({ getAgentsList: vi.fn() }));

const mockAgents = vi.mocked(getAgentsList);

describe("AgentSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAgents.mockResolvedValue({
      agents: [{ agent_id: "agent-1", agent_name: "Agent One", agent_access_groups: ["group-a"] }],
    });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", () => {
    renderWithProviders(<AgentSelector accessToken="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择 Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select agents")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentSelector accessToken="" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到 Agent")).toBeInTheDocument();
    expect(screen.queryByText("No agents found")).not.toBeInTheDocument();
  });

  it("renders the Chinese access-group description and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentSelector accessToken="token" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("访问组")).toBeInTheDocument();
    expect(screen.queryByText("Access Group")).not.toBeInTheDocument();
  });
});
