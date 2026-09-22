import React from "react";
import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import type { PolicyAttachment } from "@/components/policies/types";

import ImpactPopover from "./impact_popover";

vi.mock("@/components/networking");

const makeAttachment = (overrides: Partial<PolicyAttachment> = {}): PolicyAttachment => ({
  attachment_id: "att-001",
  policy_name: "my-policy",
  scope: null,
  teams: [],
  keys: [],
  models: [],
  tags: [],
  ...overrides,
});

const findLine = (text: string) => screen.getAllByText((_, element) => element?.textContent === text).at(0) ?? null;

const globalImpact = { affected_keys_count: -1, affected_teams_count: -1, sample_keys: [], sample_teams: [] };
const pluralImpact = {
  affected_keys_count: 2,
  affected_teams_count: 1,
  sample_keys: ["sk-key-one", "sk-key-two"],
  sample_teams: ["team-one"],
};
const noImpact = { affected_keys_count: 0, affected_teams_count: 0, sample_keys: [], sample_teams: [] };
const twoKeysOneTeam = { affected_keys_count: 2, affected_teams_count: 1, sample_keys: [], sample_teams: [] };
const oneKeyOneTeam = { affected_keys_count: 1, affected_teams_count: 1, sample_keys: [], sample_teams: [] };

const openPopover = async (user: ReturnType<typeof userEvent.setup>, accessToken: string | null = "tok") => {
  renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken={accessToken} />);
  await user.click(screen.getByRole("button", { name: "查看影响范围" }));
};

describe("ImpactPopover Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese trigger, tooltip and click-to-load state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken={null} />);

    const trigger = screen.getByRole("button", { name: "查看影响范围" });
    expect(screen.queryByRole("button", { name: "View blast radius" })).not.toBeInTheDocument();

    await user.hover(trigger);
    expect(await screen.findByText("查看影响范围")).toBeInTheDocument();
    expect(screen.queryByText("View blast radius")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(await screen.findByText("点击加载")).toBeInTheDocument();
    expect(screen.queryByText("Click to load")).not.toBeInTheDocument();
    expect(screen.getByText("影响范围")).toBeInTheDocument();
    expect(screen.queryByText("Blast Radius")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading state while the impact is fetched", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockReturnValue(new Promise(() => {}));
    await openPopover(user);

    expect(await screen.findByText("正在加载...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese global scope warning", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue(globalImpact);
    await openPopover(user);

    expect(await screen.findByText("全局范围 — 影响所有密钥和团队")).toBeInTheDocument();
    expect(screen.queryByText(/Global scope/)).not.toBeInTheDocument();
  });

  it("renders the Chinese plural counts and sample labels", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue(pluralImpact);
    await openPopover(user);

    expect(await screen.findByText("sk-key-one")).toBeInTheDocument();
    expect(findLine("2 个密钥、1 个团队受到影响")).toBeInTheDocument();
    expect(screen.getByText("密钥：")).toBeInTheDocument();
    expect(screen.queryByText("Keys:")).not.toBeInTheDocument();
    expect(screen.getByText("团队：")).toBeInTheDocument();
    expect(screen.queryByText("Teams:")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-affected message", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue(noImpact);
    await openPopover(user);

    expect(await screen.findByText("当前没有受影响的密钥或团队")).toBeInTheDocument();
    expect(screen.queryByText("No keys or teams currently affected")).not.toBeInTheDocument();
  });

  it("selects the singular and plural count words in English", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall)
      .mockResolvedValueOnce(twoKeysOneTeam)
      .mockResolvedValueOnce(oneKeyOneTeam);

    const first = renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: "View blast radius" }));
    await waitFor(() => expect(findLine("2 keys, 1 team affected")).toBeInTheDocument());
    first.unmount();

    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: "View blast radius" }));
    await waitFor(() => expect(findLine("1 key, 1 team affected")).toBeInTheDocument());
  });
});
