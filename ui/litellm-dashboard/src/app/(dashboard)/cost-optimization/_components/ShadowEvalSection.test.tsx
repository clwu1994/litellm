import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useInfiniteKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import i18n from "@/i18n/bootstrapI18n";
import { ApiError } from "@/lib/http/client";

vi.mock("./useShadowEval", () => ({
  useShadowEvalJobs: vi.fn(),
  useShadowEvalJob: vi.fn(),
  useStartShadowEval: vi.fn(),
  useStopShadowEval: vi.fn(),
}));

const authorizedRoleMock = vi.fn(() => ({ accessToken: "token", isViewOnly: false }));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ userId: "test-user-id", userRole: "Admin", ...authorizedRoleMock() }),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useInfiniteKeys: vi.fn(() => ({
    data: {
      pages: [
        {
          keys: [
            { token: "hash-alpha", token_id: "id-1", key_name: "sk-...alpha", key_alias: "prod-alpha" },
            { token: "hash-beta", token_id: "id-2", key_name: "sk-...beta", key_alias: "staging-beta" },
          ],
          total_count: 2,
          current_page: 1,
          total_pages: 1,
        },
      ],
    },
    isPending: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useInfiniteTeams: vi.fn(() => ({
    data: { pages: [{ teams: [{ team_id: "team-eng", team_alias: "engineering" }], page: 1, total_pages: 1 }] },
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock("@/app/(dashboard)/hooks/users/useUsers", () => ({
  useInfiniteUsers: vi.fn(() => ({
    data: {
      pages: [
        {
          users: [{ user_id: "dev-alice", user_alias: null, user_email: "alice@example.com" }],
          page: 1,
          total_pages: 1,
        },
      ],
    },
    isPending: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock("@/app/(dashboard)/hooks/models/useModels", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/(dashboard)/hooks/models/useModels")>()),
  useAutoRouters: vi.fn(() => ({
    data: [
      { model_name: "claude-auto", litellm_params: { model: "auto_router/claude-auto" } },
      { model_name: "gpt-auto", litellm_params: { model: "auto_router/gpt-auto" } },
    ],
  })),
  usePlainModelGroups: vi.fn(() => new Set(["prod-claude", "prod-judge"])),
  usePlainChatModelGroups: vi.fn(() => new Set(["prod-claude", "prod-judge"])),
  usePlainChatModelDeployments: vi.fn(() => [
    {
      model_name: "prod-judge",
      litellm_params: { model: "anthropic/claude-sonnet-5" },
      model_info: { mode: "chat" },
    },
  ]),
}));

vi.mock("@/components/networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/networking")>()),
  modelInfoCall: vi.fn(),
}));

import { useAutoRouters, usePlainChatModelGroups, usePlainModelGroups } from "@/app/(dashboard)/hooks/models/useModels";
import { modelInfoCall } from "@/components/networking";

import ShadowEvalSection, { shadowedTargetLabel } from "./ShadowEvalSection";
import {
  useShadowEvalJob,
  useShadowEvalJobs,
  useStartShadowEval,
  useStopShadowEval,
  type ShadowEvalJob,
} from "./useShadowEval";
import { chooseSelectOption } from "../../../../../tests/test-utils";

const job = (overrides: Partial<ShadowEvalJob> = {}): ShadowEvalJob => ({
  job_id: "job-1",
  status: "running",
  router_name: "claude-auto",
  router_names: ["claude-auto"],
  models: [],
  direction: "forward",
  baseline_model: null,
  judge_model: "prod-judge",
  shadow_percentage: 10,
  targets: [
    {
      target_type: "key",
      target_id: "hashed-key-abc",
      max_turns: 10000,
      max_budget: 10,
      spend: 3.21,
      stopped_at: null,
      target_alias: "prod-alpha",
      key_name: "sk-...alpha",
    },
  ],
  judged_count: 42,
  error_count: 1,
  judge_spend: 3.21,
  results: {
    by_tier: [
      {
        group: "SIMPLE",
        turn_count: 30,
        real_win_rate_pct: 20.0,
        shadow_win_rate_pct: 55.0,
        tie_rate_pct: 25.0,
        avg_judge_confidence: 0.81,
        real_spend: 0.4,
        shadow_spend: 0.1,
        cache_hit_turns: 2,
      },
      {
        group: "REASONING",
        turn_count: 12,
        real_win_rate_pct: 50.0,
        shadow_win_rate_pct: 33.3,
        tie_rate_pct: 16.7,
        avg_judge_confidence: 0.74,
        real_spend: 0.2,
        shadow_spend: 0.2,
        cache_hit_turns: 0,
      },
    ],
    by_current_model: [
      {
        group: "gpt-4o",
        turn_count: 42,
        real_win_rate_pct: 30.0,
        shadow_win_rate_pct: 45.0,
        tie_rate_pct: 25.0,
        avg_judge_confidence: 0.8,
        real_spend: 0.6,
        shadow_spend: 0.3,
        cache_hit_turns: 2,
      },
    ],
    overall_shadow_win_rate_pct: 48.0,
    overall_tie_rate_pct: 22.0,
    sampled_real_spend: 0.6,
    sampled_shadow_spend: 0.3,
    not_sampled_count: 378,
    unjudgeable_count: 10,
    shed_count: 2,
  },
  created_at: "2026-08-07T00:00:00Z",
  ends_at: "2026-09-07T00:00:00Z",
  last_error: null,
  ...overrides,
});

const targetEntry = (
  target_id: string,
  overrides: Partial<ShadowEvalJob["targets"][number]> = {},
): ShadowEvalJob["targets"][number] => ({
  target_type: "key",
  target_id,
  max_turns: 10000,
  max_budget: 10,
  spend: 0,
  stopped_at: null,
  attempt_count: null,
  target_alias: null,
  key_name: null,
  ...overrides,
});

const mockHooks = ({
  jobs = [],
  detailsById = {},
  error = null,
  detailError = false,
  isPending = false,
}: {
  jobs?: ShadowEvalJob[];
  detailsById?: Record<string, ShadowEvalJob>;
  error?: Error | null;
  detailError?: boolean;
  isPending?: boolean;
}) => {
  vi.mocked(useShadowEvalJobs).mockReturnValue({
    data: error || isPending ? undefined : jobs,
    error,
    isPending,
  } as unknown as ReturnType<typeof useShadowEvalJobs>);
  vi.mocked(useShadowEvalJob).mockImplementation(
    (jobId) =>
      ({
        data: jobId ? detailsById[jobId] : undefined,
        isError: detailError ?? false,
      }) as unknown as ReturnType<typeof useShadowEvalJob>,
  );
  const start = { mutate: vi.fn(), isPending: false };
  const stop = { mutate: vi.fn(), isPending: false };
  vi.mocked(useStartShadowEval).mockReturnValue(start as unknown as ReturnType<typeof useStartShadowEval>);
  vi.mocked(useStopShadowEval).mockReturnValue(stop as unknown as ReturnType<typeof useStopShadowEval>);
  return { start, stop };
};

describe("ShadowEvalSection", () => {
  beforeEach(() => {
    authorizedRoleMock.mockReturnValue({ accessToken: "token", isViewOnly: false });
  });

  it("shows a key picker load failure instead of posing as no matching keys", async () => {
    const user = userEvent.setup();
    const defaultKeysImpl = vi.mocked(useInfiniteKeys).getMockImplementation();
    vi.mocked(useInfiniteKeys).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useInfiniteKeys>);
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("Search keys by alias"));
    expect(await screen.findByText("Keys could not be loaded. Refresh the page to retry.")).toBeInTheDocument();
    expect(screen.queryByText("No matching keys")).not.toBeInTheDocument();
    if (defaultKeysImpl) vi.mocked(useInfiniteKeys).mockImplementation(defaultKeysImpl);
  });

  it("labels only configured judge recommendations", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("Select a judge model"));
    expect(screen.getByRole("option", { name: /prod-judge.*Recommended/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /openai\/gpt-4o/ })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await chooseSelectOption(
      user,
      screen.getByText("Adoption check: key's traffic vs the router"),
      "Regression check: router's picks vs a baseline",
    );
    await user.click(screen.getByPlaceholderText("Select a baseline model"));
    expect(screen.getByRole("option", { name: "prod-judge", exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
  });

  it("keeps custom models selectable through the real model hooks without widening chat choices to traffic filters", async () => {
    const hooks = await vi.importActual<typeof import("@/app/(dashboard)/hooks/models/useModels")>(
      "@/app/(dashboard)/hooks/models/useModels",
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const deployments = [
      { model_name: "custom-chat", litellm_params: { model: "openai/private-chat" } },
      { model_name: "custom-judge", litellm_params: { model: "openai/private-judge" }, model_info: { mode: null } },
      {
        model_name: "embedding",
        litellm_params: { model: "openai/private-embedding" },
        model_info: { mode: "embedding" },
      },
      {
        model_name: "responses-only",
        litellm_params: { model: "openai/private-responses" },
        model_info: { mode: "responses" },
      },
      { model_name: "auto-router", litellm_params: { model: "auto_router/complexity_router" } },
    ];
    vi.mocked(modelInfoCall).mockResolvedValue({ data: deployments, total_pages: 1 });
    const user = userEvent.setup();
    const { start } = mockHooks({});
    await vi.mocked(usePlainModelGroups).withImplementation(hooks.usePlainModelGroups, async () => {
      await vi.mocked(usePlainChatModelGroups).withImplementation(hooks.usePlainChatModelGroups, async () => {
        render(
          <QueryClientProvider client={client}>
            <ShadowEvalSection />
          </QueryClientProvider>,
        );
        await chooseSelectOption(user, screen.getByPlaceholderText("Every model the targets use"), "responses-only");
        await chooseSelectOption(user, screen.getByPlaceholderText("Every model the targets use"), "custom-chat");
        await chooseSelectOption(
          user,
          screen.getByText("Adoption check: key's traffic vs the router"),
          "Regression check: router's picks vs a baseline",
        );
        await user.click(screen.getByPlaceholderText("Search keys by alias"));
        await user.click(within(await screen.findByTestId("paginated-multi-select-list")).getByText("prod-alpha"));
        await chooseSelectOption(user, screen.getByPlaceholderText("Select up to 4 auto-routers"), "gpt-auto");
        await user.click(screen.getByPlaceholderText("Select a judge model"));
        expect(screen.getAllByRole("option")).toHaveLength(2);
        expect(screen.getByRole("option", { name: "custom-chat", exact: true })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "custom-judge", exact: true })).toBeInTheDocument();
        await user.click(screen.getByRole("option", { name: "custom-judge", exact: true }));
        await user.click(screen.getByPlaceholderText("Select a baseline model"));
        expect(screen.getAllByRole("option")).toHaveLength(2);
        expect(screen.getByRole("option", { name: "custom-chat", exact: true })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "custom-judge", exact: true })).toBeInTheDocument();
        await user.click(screen.getByRole("option", { name: "custom-chat", exact: true }));
        await user.click(screen.getByText("Start shadow eval"));
        expect(start.mutate).toHaveBeenCalledWith(
          expect.objectContaining({ judge_model: "custom-judge", baseline_model: "custom-chat", models: [] }),
        );
      });
    });
    client.clear();
  });

  it("offers the start form while the list is still loading", () => {
    mockHooks({ isPending: true });
    render(<ShadowEvalSection />);
    expect(screen.getByText("Loading evaluations...")).toBeInTheDocument();
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
  });

  it("re-offers the start form when the polled detail sees the job finish before the list does", () => {
    mockHooks({
      jobs: [job({ status: "running" })],
      detailsById: { "job-1": job({ status: "completed" }) },
    });
    render(<ShadowEvalSection />);
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
  });

  it("gives every active job its own card with a stop button, with the form still offered", () => {
    mockHooks({
      jobs: [
        job({ job_id: "job-a", status: "running", targets: [targetEntry("key-a")] }),
        job({ job_id: "job-b", status: "running", targets: [targetEntry("key-b")] }),
      ],
    });
    render(<ShadowEvalSection />);
    expect(screen.getAllByRole("button", { name: "Stop" })).toHaveLength(2);
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
    expect(screen.queryByText(/Previous evaluations/)).not.toBeInTheDocument();
  });

  it("renders the active card from the list row while its detail is still loading", () => {
    mockHooks({ jobs: [job({ status: "running" })], detailsById: {} });
    render(<ShadowEvalSection />);
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("hides the start form and stop button from view-only admins", () => {
    authorizedRoleMock.mockReturnValue({ accessToken: "token", isViewOnly: true });
    mockHooks({ jobs: [job({ status: "running" })] });
    render(<ShadowEvalSection />);
    expect(screen.queryByText("Start a shadow eval")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("never labels a collapsed previous eval as empty from a countless list row", () => {
    const countlessListRow: Partial<ShadowEvalJob> = {
      job_id: "job-old",
      status: "stopped",
      judged_count: null,
      error_count: null,
      judge_spend: null,
      results: null,
    };
    mockHooks({ jobs: [job({ status: "running" }), job(countlessListRow)] });
    render(<ShadowEvalSection />);
    fireEvent.click(screen.getByRole("button", { name: /Previous evaluations/ }));
    expect(screen.getByText("view results")).toBeInTheDocument();
    expect(screen.queryByText("no verdicts")).not.toBeInTheDocument();
    expect(screen.queryByText(/0 judged/)).not.toBeInTheDocument();
  });

  it("surfaces a non-403 list failure instead of posing as an empty state", () => {
    mockHooks({ error: new Error("boom") });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/Existing evaluations could not be loaded/)).toBeInTheDocument();
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
  });

  it("shows a failure line instead of loading forever when the detail fetch errors", () => {
    mockHooks({
      jobs: [job({ status: "completed", judged_count: 12, results: null })],
      detailsById: {},
      detailError: true,
    });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/Results could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByText("Loading results...")).not.toBeInTheDocument();
  });

  it("shows the failure line over the collecting copy when an active job's detail errors", () => {
    mockHooks({ jobs: [job({ status: "running", results: null })], detailsById: {}, detailError: true });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/Results could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByText(/Collecting verdicts/)).not.toBeInTheDocument();
  });

  it("never claims no verdicts for a judged job whose results have not loaded yet", () => {
    mockHooks({ jobs: [job({ status: "completed", judged_count: 12, results: null })], detailsById: {} });
    render(<ShadowEvalSection />);
    expect(screen.getByText("Loading results...")).toBeInTheDocument();
    expect(screen.queryByText(/No verdicts were recorded/)).not.toBeInTheDocument();
  });

  it("shows the start form when there are no jobs", () => {
    mockHooks({});
    render(<ShadowEvalSection />);
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
    expect(screen.getByText("Start shadow eval")).toBeInTheDocument();
  });

  it("renders the latest job's results with the headline stat, verdict split, and both stratifications", () => {
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    expect(screen.getByText("Router matched or beat your current model")).toBeInTheDocument();
    expect(screen.getByText("70.0%")).toBeInTheDocument();
    expect(screen.getByText("of 42 judged responses")).toBeInTheDocument();
    expect(screen.getByText(/Tie 22.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Current model won 30.0%/)).toBeInTheDocument();
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("SIMPLE")).toBeInTheDocument();
    expect(screen.getByText("REASONING")).toBeInTheDocument();
    expect(screen.getByText("55.0%")).toBeInTheDocument();
  });

  it("shows the ends-in text while a job is still sampling", () => {
    const j = job({ ends_at: new Date(Date.now() + 3 * 86_400_000).toISOString() });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/ends in 3 days/)).toBeInTheDocument();
  });

  it("shows recorded eval spend against the job's dollar budget", () => {
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/\$3\.21 of \$10\.00 eval spend/)).toBeInTheDocument();
  });

  it("shows spend without a budget cap for a job from before spend budgets existed", () => {
    const j = job({ targets: [targetEntry("hashed-key-abc", { max_budget: null, spend: 3.21 })] });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/\$3\.21 eval spend/)).toBeInTheDocument();
    expect(screen.queryByText(/of \$/)).not.toBeInTheDocument();
  });

  it("flags rows with fewer than 30 judged turns as low sample", () => {
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getAllByText("(low sample)")).toHaveLength(1);
  });

  it("surfaces the last failure so a growing error_count is diagnosable", () => {
    const j = job({ error_count: 7, last_error: "judge call failed: LLM Provider NOT provided" });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/LLM Provider NOT provided/)).toBeInTheDocument();
  });

  it("stops the running job from the stop button", async () => {
    const user = userEvent.setup();
    const j = job();
    const { stop } = mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    await user.click(screen.getByText("Stop"));

    expect(stop.mutate).toHaveBeenCalledWith("job-1");
  });

  it("hides the stop button and offers the start form once the latest job completed", () => {
    const done = job({ status: "completed" });
    mockHooks({ jobs: [done], detailsById: { "job-1": done } });
    render(<ShadowEvalSection />);
    expect(screen.queryByText("Stop")).not.toBeInTheDocument();
    expect(screen.getByText("Start a shadow eval")).toBeInTheDocument();
  });

  it("renders nothing for non-admins when the proxy answers 403", () => {
    mockHooks({ error: new ApiError("forbidden", 403, {}) });
    const { container } = render(<ShadowEvalSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the start button disabled until key, router, and judge model are picked, then submits every picked key", async () => {
    const user = userEvent.setup();
    const { start } = mockHooks({});
    render(<ShadowEvalSection />);

    expect(screen.getByText("Start shadow eval")).toBeDisabled();

    const keyInput = screen.getByPlaceholderText("Search keys by alias");
    await user.click(keyInput);
    const keyList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(keyList).getByText("prod-alpha"));
    await user.click(keyInput);
    await user.click(within(keyList).getByText("staging-beta"));
    await chooseSelectOption(user, screen.getByPlaceholderText("Select up to 4 auto-routers"), "gpt-auto");

    expect(screen.getByText("Start shadow eval")).toBeDisabled();

    await user.click(screen.getByPlaceholderText("Select a judge model"));
    expect(screen.queryByRole("option", { name: /openai\/gpt-4o/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));
    await user.click(screen.getByText("Start shadow eval"));

    const expectedBody = {
      api_key_ids: ["hash-alpha", "hash-beta"],
      team_ids: [],
      user_ids: [],
      models: [],
      router_names: ["gpt-auto"],
      direction: "forward",
      shadow_percentage: 10,
      duration_days: 7,
      max_budget: 10,
      judge_model: "prod-judge",
    };
    expect(start.mutate).toHaveBeenCalledWith(expectedBody);
  });

  it("submits a team-only job with team_ids and no keys", async () => {
    const user = userEvent.setup();
    const { start } = mockHooks({});
    render(<ShadowEvalSection />);

    expect(screen.getByText("Start shadow eval")).toBeDisabled();

    await user.click(screen.getByPlaceholderText("Search teams by alias"));
    const teamList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(teamList).getByText("engineering"));
    await chooseSelectOption(user, screen.getByPlaceholderText("Select up to 4 auto-routers"), "gpt-auto");
    await user.click(screen.getByPlaceholderText("Select a judge model"));
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));
    await user.click(screen.getByText("Start shadow eval"));

    const expectedBody = {
      api_key_ids: [],
      team_ids: ["team-eng"],
      user_ids: [],
      models: [],
      router_names: ["gpt-auto"],
      direction: "forward",
      shadow_percentage: 10,
      duration_days: 7,
      max_budget: 10,
      judge_model: "prod-judge",
    };
    expect(start.mutate).toHaveBeenCalledWith(expectedBody);
  });

  it("narrows a job to the picked model groups and shows the scope on the job headline", async () => {
    const user = userEvent.setup();
    const { start } = mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("Search teams by alias"));
    const teamList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(teamList).getByText("engineering"));
    await chooseSelectOption(user, screen.getByPlaceholderText("Every model the targets use"), "prod-claude");
    await chooseSelectOption(user, screen.getByPlaceholderText("Select up to 4 auto-routers"), "gpt-auto");
    await user.click(screen.getByPlaceholderText("Select a judge model"));
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));
    await user.click(screen.getByText("Start shadow eval"));

    expect(start.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ team_ids: ["team-eng"], models: ["prod-claude"] }),
    );

    const scoped = job({ models: ["prod-claude", "prod-haiku"] });
    mockHooks({ jobs: [scoped], detailsById: { "job-1": scoped } });
    render(<ShadowEvalSection />);
    expect(screen.getByText("prod-claude, prod-haiku")).toBeInTheDocument();
  });

  it("requires a baseline model in reverse mode and submits it, while forward mode never shows the picker", async () => {
    const user = userEvent.setup();
    const { start } = mockHooks({});
    render(<ShadowEvalSection />);

    expect(screen.queryByPlaceholderText("Select a baseline model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Every model the targets use")).toBeInTheDocument();

    await chooseSelectOption(
      user,
      screen.getByText("Adoption check: key's traffic vs the router"),
      "Regression check: router's picks vs a baseline",
    );
    expect(screen.queryByPlaceholderText("Every model the targets use")).not.toBeInTheDocument();
    await user.click(screen.getByPlaceholderText("Search keys by alias"));
    const keyList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(keyList).getByText("prod-alpha"));
    await chooseSelectOption(user, screen.getByPlaceholderText("Select up to 4 auto-routers"), "gpt-auto");
    await user.click(screen.getByPlaceholderText("Select a judge model"));
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));

    expect(screen.getByText("Start shadow eval")).toBeDisabled();

    await user.click(screen.getByPlaceholderText("Select a baseline model"));
    expect(screen.queryByRole("option", { name: /openai\/gpt-4o/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /prod-claude/ }));
    await user.click(screen.getByText("Start shadow eval"));

    const expectedBody = {
      api_key_ids: ["hash-alpha"],
      team_ids: [],
      user_ids: [],
      models: [],
      router_names: ["gpt-auto"],
      direction: "reverse",
      baseline_model: "prod-claude",
      shadow_percentage: 10,
      duration_days: 7,
      max_budget: 10,
      judge_model: "prod-judge",
    };
    expect(start.mutate).toHaveBeenCalledWith(expectedBody);
  });

  it("submits every picked auto-router so one job compares them on the same traffic", async () => {
    const user = userEvent.setup();
    const { start } = mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("Search keys by alias"));
    const keyList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(keyList).getByText("prod-alpha"));
    const routerInput = screen.getByPlaceholderText("Select up to 4 auto-routers");
    await user.click(routerInput);
    await user.click(await screen.findByText("gpt-auto"));
    await user.click(routerInput);
    await user.click(await screen.findByText("claude-auto"));
    expect(
      screen.getByText("Every router sees the same sampled requests, judged against the same live responses"),
    ).toBeInTheDocument();
    await user.click(screen.getByPlaceholderText("Select a judge model"));
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));
    await user.click(screen.getByText("Start shadow eval"));

    const expectedBody = {
      api_key_ids: ["hash-alpha"],
      team_ids: [],
      user_ids: [],
      models: [],
      router_names: ["gpt-auto", "claude-auto"],
      direction: "forward",
      shadow_percentage: 10,
      duration_days: 7,
      max_budget: 10,
      judge_model: "prod-judge",
    };
    expect(start.mutate).toHaveBeenCalledWith(expectedBody);
  });

  it("blocks starting a reverse job with more than one router and says why", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("Search keys by alias"));
    const keyList = await screen.findByTestId("paginated-multi-select-list");
    await user.click(within(keyList).getByText("prod-alpha"));
    const routerInput = screen.getByPlaceholderText("Select up to 4 auto-routers");
    await user.click(routerInput);
    await user.click(await screen.findByText("gpt-auto"));
    await user.click(routerInput);
    await user.click(await screen.findByText("claude-auto"));
    await chooseSelectOption(
      user,
      screen.getByText("Adoption check: key's traffic vs the router"),
      "Regression check: router's picks vs a baseline",
    );
    await user.click(screen.getByPlaceholderText("Select a judge model"));
    await user.click(await screen.findByRole("option", { name: /prod-judge/ }));
    await user.click(screen.getByPlaceholderText("Select a baseline model"));
    await user.click(screen.getByRole("option", { name: /prod-claude/ }));

    expect(screen.getByText("A regression check compares one router to its baseline")).toBeInTheDocument();
    expect(screen.getByText("Start shadow eval")).toBeDisabled();
  });

  it("renders a per-router comparison table only when the job ran several routers", () => {
    const routerSlice = (group: string, wins: number) => ({
      group,
      turn_count: 20,
      real_win_rate_pct: 100 - wins - 10,
      shadow_win_rate_pct: wins,
      tie_rate_pct: 10,
      avg_judge_confidence: 0.8,
      real_spend: 0.4,
      shadow_spend: 0.2,
      cache_hit_turns: 0,
    });
    const base = job();
    const multi = job({
      router_names: ["claude-auto", "gpt-auto"],
      results: { ...base.results!, by_router: [routerSlice("claude-auto", 40), routerSlice("gpt-auto", 70)] },
    });
    mockHooks({ jobs: [multi], detailsById: { "job-1": multi } });
    render(<ShadowEvalSection />);

    expect(screen.getByText("Router")).toBeInTheDocument();
    const rows = screen.getAllByRole("row").map((row) => row.textContent ?? "");
    expect(rows.some((text) => text.includes("claude-auto") && text.includes("40.0%"))).toBe(true);
    expect(rows.some((text) => text.includes("gpt-auto") && text.includes("70.0%"))).toBe(true);
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === "Shadowing 10% of prod-alpha traffic via claude-auto, gpt-auto" &&
          element.tagName === "P",
      ),
    ).toBeInTheDocument();
  });

  it("renders a job from an older proxy that predates router_names", () => {
    const legacy = { ...job(), router_names: undefined } as unknown as ShadowEvalJob;
    mockHooks({ jobs: [legacy], detailsById: { "job-1": legacy } });
    render(<ShadowEvalSection />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === "Shadowing 10% of prod-alpha traffic via claude-auto" && element.tagName === "P",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the per-router table hidden for a single-router job", () => {
    const base = job();
    const single = job({ results: { ...base.results!, by_router: [] } });
    mockHooks({ jobs: [single], detailsById: { "job-1": single } });
    render(<ShadowEvalSection />);

    expect(screen.queryByText("Router")).not.toBeInTheDocument();
  });

  it("flips the arm labels and headline for a reverse job's results", () => {
    const j = job({ direction: "reverse", baseline_model: "openai/gpt-4o" });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Comparing claude-auto to openai/gpt-4o on 10% of prod-alpha traffic",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Router matched or beat the baseline")).toBeInTheDocument();
    expect(screen.getByText("52.0%")).toBeInTheDocument();
    expect(screen.getByText(/Router won 30.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Baseline won 48.0%/)).toBeInTheDocument();
    expect(screen.getAllByText("Baseline wins")).toHaveLength(2);
    expect(screen.getByText("Router pick")).toBeInTheDocument();
    expect(screen.queryByText(/Current model/)).not.toBeInTheDocument();
    expect(screen.queryByText("Compared against")).not.toBeInTheDocument();
  });

  it("labels the shadowed key by alias, then masked name, then truncated hash", () => {
    expect(shadowedTargetLabel(job().targets[0])).toBe("prod-alpha");
    expect(shadowedTargetLabel(targetEntry("hashed-key-abc", { key_name: "sk-...alpha" }))).toBe("sk-...alpha");
    expect(shadowedTargetLabel(targetEntry("hashed-key-abc"))).toBe("hashed-key…");
    expect(shadowedTargetLabel(targetEntry("team-eng", { target_type: "team" }))).toBe("team-eng");
    expect(shadowedTargetLabel(targetEntry("team-eng", { target_type: "team", target_alias: "engineering" }))).toBe(
      "engineering",
    );
  });

  it("breaks results down per key, so one key exhausting its own budget is visible while a sibling runs on", () => {
    mockHooks({
      jobs: [
        job({
          judged_count: 205,
          targets: [
            targetEntry("hash-spent", {
              max_budget: 2,
              spend: 1.5,
              stopped_at: "2026-08-08T00:00:00Z",
              verdicts: {
                group: "hash-spent",
                turn_count: 200,
                real_win_rate_pct: 20.0,
                shadow_win_rate_pct: 60.0,
                tie_rate_pct: 20.0,
                avg_judge_confidence: 0.9,
                real_spend: 0.9,
                shadow_spend: 0.5,
                cache_hit_turns: 0,
              },
            }),
            targetEntry("hash-hungry", { max_budget: 5, spend: 0.2 }),
          ],
          results: {
            by_tier: [],
            by_current_model: [],
            overall_shadow_win_rate_pct: 60.0,
            overall_tie_rate_pct: 20.0,
            sampled_real_spend: 0.9,
            sampled_shadow_spend: 0.5,
          },
        }),
      ],
    });
    render(<ShadowEvalSection />);

    const spent = screen.getByText("hash-spent…").closest("tr");
    const hungry = screen.getByText("hash-hungr…").closest("tr");
    if (!spent || !hungry) throw new Error("expected a table row per scoped key");

    expect(within(spent).getByText("stopped")).toBeInTheDocument();
    expect(within(spent).getByText("$1.50 / $2.00")).toBeInTheDocument();
    expect(within(spent).getByText("60.0%")).toBeInTheDocument();

    expect(within(hungry).getByText("running")).toBeInTheDocument();
    expect(within(hungry).getByText("$0.2000 / $5.00")).toBeInTheDocument();
    expect(within(hungry).getByText("No verdicts yet")).toBeInTheDocument();

    expect(screen.getByText(/205 turns judged/)).toBeInTheDocument();
    expect(screen.getByText(/Shadowing 10% of/)).toBeInTheDocument();
    expect(screen.getByText("2 targets")).toBeInTheDocument();
  });

  it("reads a key that spent its budget as completed even before the sweep stamps it", () => {
    const legacyTurnBudgetLeg = { max_budget: null, spend: 0.5, max_turns: 500, attempt_count: 3 };
    mockHooks({
      jobs: [
        job({
          targets: [
            targetEntry("hash-spent", { max_budget: 2, spend: 2, attempt_count: 40 }),
            targetEntry("hash-hungry", legacyTurnBudgetLeg),
          ],
        }),
      ],
    });
    render(<ShadowEvalSection />);

    const spent = screen.getByText("hash-spent…").closest("tr");
    const hungry = screen.getByText("hash-hungr…").closest("tr");
    if (!spent || !hungry) throw new Error("expected a table row per scoped key");
    expect(within(spent).getByText("completed")).toBeInTheDocument();
    expect(within(spent).getByText("$2.00 / $2.00")).toBeInTheDocument();
    expect(within(hungry).getByText("running")).toBeInTheDocument();
    expect(within(hungry).getByText("3 / 500 turns")).toBeInTheDocument();
  });

  it("shows the per-key table while a multi-key job is still collecting, before any verdicts exist", () => {
    mockHooks({
      jobs: [
        job({
          judged_count: 0,
          results: null,
          targets: [
            targetEntry("hash-spent", { max_budget: 0.5, spend: 0.5, attempt_count: 2 }),
            targetEntry("hash-hungry", { max_budget: 5, spend: 0.01, attempt_count: 1 }),
          ],
        }),
      ],
    });
    render(<ShadowEvalSection />);

    const spent = screen.getByText("hash-spent…").closest("tr");
    if (!spent) throw new Error("expected a per-key row before verdicts exist");
    expect(within(spent).getByText("completed")).toBeInTheDocument();
    expect(within(spent).getByText("$0.5000 / $0.5000")).toBeInTheDocument();
    expect(screen.getByText("Budget used")).toBeInTheDocument();
    expect(screen.queryByText("Judged turns")).not.toBeInTheDocument();
    expect(screen.getByText(/Collecting verdicts/)).toBeInTheDocument();
  });

  it("reads every key as completed once the job's window closes, whatever its own stop state", () => {
    mockHooks({
      jobs: [
        job({
          status: "completed",
          targets: [
            targetEntry("hash-spent", { max_turns: 200, stopped_at: "2026-08-08T00:00:00Z" }),
            targetEntry("hash-hungry", { max_turns: 500 }),
          ],
        }),
      ],
    });
    render(<ShadowEvalSection />);

    const hungry = screen.getByText("hash-hungr…").closest("tr");
    if (!hungry) throw new Error("expected a table row per scoped key");
    expect(within(hungry).getByText("completed")).toBeInTheDocument();
    expect(within(hungry).queryByText("running")).not.toBeInTheDocument();
  });

  it("shows the measured cost comparison with savings and both arm totals", () => {
    const j = job({});
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);
    expect(screen.getByText("Router cost vs your current model")).toBeInTheDocument();
    expect(screen.getByText("-50.0%")).toBeInTheDocument();
    expect(
      screen.getByText("$0.3000 vs $0.6000 on the same judged turns; 2 cache-served turns excluded"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Router cost").length).toBeGreaterThan(0);
  });

  it("hides the cost tile when either arm has no measured spend, so a pre-measurement job never reads as a free incumbent", () => {
    const legacy = job({});
    legacy.results = {
      ...legacy.results!,
      by_tier: legacy.results!.by_tier.map((s) => ({ ...s, real_spend: 0 })),
      sampled_real_spend: 0,
      sampled_shadow_spend: 0.3,
    };
    mockHooks({ jobs: [legacy], detailsById: { "job-1": legacy } });
    render(<ShadowEvalSection />);
    expect(screen.queryByText(/Router cost vs/)).not.toBeInTheDocument();
    expect(screen.getByText("Router matched or beat your current model")).toBeInTheDocument();
  });

  it("flips the cost comparison arms for a reverse job", () => {
    const reverse = job({ direction: "reverse", baseline_model: "gpt-4o-mini" });
    mockHooks({ jobs: [reverse], detailsById: { "job-1": reverse } });
    render(<ShadowEvalSection />);
    expect(screen.getByText("Router cost vs the baseline")).toBeInTheDocument();
    expect(screen.getByText(/\$0\.6000 vs \$0\.3000 on the same judged turns/)).toBeInTheDocument();
    expect(screen.getByText("+100.0%")).toBeInTheDocument();
  });

  it("keeps an older job's verdicts reachable through the previous evaluations list", async () => {
    const user = userEvent.setup();
    const emptyOverrides: Partial<ShadowEvalJob> = {
      job_id: "job-new",
      status: "running",
      judged_count: 0,
      error_count: 0,
      results: null,
    };
    const current = job(emptyOverrides);
    const older = job({ job_id: "job-old", status: "completed", results: null });
    mockHooks({ jobs: [current, older], detailsById: { "job-new": current, "job-old": job({ job_id: "job-old" }) } });
    render(<ShadowEvalSection />);

    expect(screen.queryByText("SIMPLE")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Previous evaluations \(1\)/ }));
    expect(screen.getByText("view results")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /10% of prod-alpha traffic via claude-auto/ }));

    expect(await screen.findByText("SIMPLE")).toBeInTheDocument();
    expect(screen.getByText("REASONING")).toBeInTheDocument();
  });
});

describe("ShadowEvalSection Chinese copy", () => {
  beforeEach(async () => {
    authorizedRoleMock.mockReturnValue({ accessToken: "token", isViewOnly: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese chrome and start form labels and hides the English ones", () => {
    mockHooks({});
    render(<ShadowEvalSection />);

    expect(screen.getByRole("heading", { name: "影子评估" })).toBeInTheDocument();
    expect(screen.getByText(/对某个密钥、团队或用户/)).toBeInTheDocument();
    expect(screen.getByText("启动影子评估")).toBeInTheDocument();
    expect(screen.getByText("开始影子评估")).toBeInTheDocument();
    expect(screen.getByText("方向")).toBeInTheDocument();
    expect(screen.getByText("要影子的密钥")).toBeInTheDocument();
    expect(screen.getByText("要影子的团队")).toBeInTheDocument();
    expect(screen.getByText("要影子的用户")).toBeInTheDocument();
    expect(screen.getByText("仅限模型")).toBeInTheDocument();
    expect(screen.getByText("自动路由")).toBeInTheDocument();
    expect(screen.getByText("采样流量")).toBeInTheDocument();
    expect(screen.getByText("时长")).toBeInTheDocument();
    expect(screen.getByText("支出预算")).toBeInTheDocument();
    expect(screen.getByText("评判模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按别名搜索密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按别名搜索团队")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按邮箱搜索用户")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("目标使用的所有模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("最多选择 4 个自动路由")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择评判模型")).toBeInTheDocument();
    expect(screen.getByText("占流量百分比")).toBeInTheDocument();
    expect(screen.getByText("每个目标的影子 + 评判支出上限")).toBeInTheDocument();
    expect(screen.getByText("采用检查：密钥流量 vs 路由器")).toBeInTheDocument();
    expect(screen.getByText("7 天")).toBeInTheDocument();
    expect(screen.getByText(/将所选目标（密钥、团队或用户）流量的一个采样切片/)).toBeInTheDocument();
    expect(screen.getByText("将上方每个目标缩小到对这些模型的请求")).toBeInTheDocument();

    expect(screen.queryByText("Shadow eval")).not.toBeInTheDocument();
    expect(screen.queryByText("Start a shadow eval")).not.toBeInTheDocument();
    expect(screen.queryByText("Start shadow eval")).not.toBeInTheDocument();
    expect(screen.queryByText("Direction")).not.toBeInTheDocument();
    expect(screen.queryByText("Keys to shadow")).not.toBeInTheDocument();
    expect(screen.queryByText("Teams to shadow")).not.toBeInTheDocument();
    expect(screen.queryByText("Users to shadow")).not.toBeInTheDocument();
    expect(screen.queryByText("Only on models")).not.toBeInTheDocument();
    expect(screen.queryByText("Auto-routers")).not.toBeInTheDocument();
    expect(screen.queryByText("Traffic sampled")).not.toBeInTheDocument();
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
    expect(screen.queryByText("Spend budget")).not.toBeInTheDocument();
    expect(screen.queryByText("Judge model")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search keys by alias")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search teams by alias")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search users by email")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Every model the targets use")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select up to 4 auto-routers")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a judge model")).not.toBeInTheDocument();
    expect(screen.queryByText("Adoption check: key's traffic vs the router")).not.toBeInTheDocument();
    expect(screen.queryByText("% of traffic")).not.toBeInTheDocument();
    expect(screen.queryByText("max shadow + judge spend, per target")).not.toBeInTheDocument();
  });

  it("renders the Chinese direction options and hides the English ones", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByText("采用检查：密钥流量 vs 路由器"));

    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "采用检查：密钥流量 vs 路由器",
      "回归检查：路由器选择 vs 基线",
    ]);
    expect(
      screen.queryByRole("option", { name: "Adoption check: key's traffic vs the router" }),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese duration options and hides the English ones", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByText("7 天"));

    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "1 天",
      "3 天",
      "7 天",
      "14 天",
      "30 天",
    ]);
    expect(screen.queryByRole("option", { name: "1 day" })).not.toBeInTheDocument();
  });

  it("labels the recommended judge model in Chinese and hides the English one", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("选择评判模型"));

    expect(screen.getByRole("option", { name: /prod-judge.*推荐/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /prod-judge.*Recommended/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese reverse baseline field and description and hides the English ones", async () => {
    const user = userEvent.setup();
    mockHooks({});
    render(<ShadowEvalSection />);

    await chooseSelectOption(user, screen.getByText("采用检查：密钥流量 vs 路由器"), "回归检查：路由器选择 vs 基线");

    expect(screen.getByText("基线模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择基线模型")).toBeInTheDocument();
    expect(screen.getByText(/将自动路由已经在服务的流量的一个采样切片/)).toBeInTheDocument();
    expect(screen.queryByText("Baseline model")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a baseline model")).not.toBeInTheDocument();
  });

  it("renders the Chinese percentage and budget range validation and hides the English ones", () => {
    mockHooks({});
    render(<ShadowEvalSection />);

    const [percentageInput, budgetInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(percentageInput, { target: { value: "200" } });
    expect(screen.getByText("请输入 0.1 到 100 之间的值")).toBeInTheDocument();

    fireEvent.change(budgetInput, { target: { value: "0.001" } });
    expect(screen.getByText("请输入 0.01 到 10000 之间的值")).toBeInTheDocument();

    expect(screen.queryByText("Enter a value from 0.1 to 100")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a value from 0.01 to 10000")).not.toBeInTheDocument();
  });

  it("renders the Chinese picker empty states", async () => {
    const user = userEvent.setup();
    const keysImpl = vi.mocked(useInfiniteKeys).getMockImplementation();
    const usersImpl = vi.mocked(useInfiniteUsers).getMockImplementation();
    const groupsImpl = vi.mocked(usePlainModelGroups).getMockImplementation();
    const chatGroupsImpl = vi.mocked(usePlainChatModelGroups).getMockImplementation();
    const routersImpl = vi.mocked(useAutoRouters).getMockImplementation();
    vi.mocked(useInfiniteKeys).mockImplementation(
      () =>
        ({
          data: { pages: [{ keys: [], total_count: 0, current_page: 1, total_pages: 1 }] },
          isPending: false,
          isError: false,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }) as unknown as ReturnType<typeof useInfiniteKeys>,
    );
    vi.mocked(useInfiniteUsers).mockImplementation(
      () =>
        ({
          data: { pages: [{ users: [], page: 1, total_pages: 1 }] },
          isPending: false,
          isError: false,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }) as unknown as ReturnType<typeof useInfiniteUsers>,
    );
    vi.mocked(usePlainModelGroups).mockImplementation(() => new Set<string>());
    vi.mocked(usePlainChatModelGroups).mockImplementation(() => new Set<string>());
    vi.mocked(useAutoRouters).mockImplementation(() => ({ data: [] }) as unknown as ReturnType<typeof useAutoRouters>);
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("按别名搜索密钥"));
    expect(await screen.findByText("没有匹配的密钥")).toBeInTheDocument();
    expect(screen.queryByText("No matching keys")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByPlaceholderText("按邮箱搜索用户"));
    expect(await screen.findByText("没有匹配的用户")).toBeInTheDocument();
    expect(screen.queryByText("No matching users")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByPlaceholderText("目标使用的所有模型"));
    expect(await screen.findByText("未配置模型")).toBeInTheDocument();
    expect(screen.queryByText("No models configured")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByPlaceholderText("最多选择 4 个自动路由"));
    expect(await screen.findByText("未配置自动路由")).toBeInTheDocument();
    expect(screen.queryByText("No auto-routers configured")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByPlaceholderText("选择评判模型"));
    expect(await screen.findByText("没有可用的对话模型")).toBeInTheDocument();
    expect(screen.queryByText("No chat models available")).not.toBeInTheDocument();

    if (keysImpl) vi.mocked(useInfiniteKeys).mockImplementation(keysImpl);
    if (usersImpl) vi.mocked(useInfiniteUsers).mockImplementation(usersImpl);
    if (groupsImpl) vi.mocked(usePlainModelGroups).mockImplementation(groupsImpl);
    if (chatGroupsImpl) vi.mocked(usePlainChatModelGroups).mockImplementation(chatGroupsImpl);
    if (routersImpl) vi.mocked(useAutoRouters).mockImplementation(routersImpl);
  });

  it("renders the Chinese picker load failures", async () => {
    const user = userEvent.setup();
    const keysImpl = vi.mocked(useInfiniteKeys).getMockImplementation();
    const usersImpl = vi.mocked(useInfiniteUsers).getMockImplementation();
    vi.mocked(useInfiniteKeys).mockImplementation(
      () =>
        ({
          data: undefined,
          isPending: false,
          isError: true,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }) as unknown as ReturnType<typeof useInfiniteKeys>,
    );
    vi.mocked(useInfiniteUsers).mockImplementation(
      () =>
        ({
          data: undefined,
          isPending: false,
          isError: true,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }) as unknown as ReturnType<typeof useInfiniteUsers>,
    );
    mockHooks({});
    render(<ShadowEvalSection />);

    await user.click(screen.getByPlaceholderText("按别名搜索密钥"));
    expect(await screen.findByText("无法加载密钥。刷新页面重试。")).toBeInTheDocument();
    expect(screen.queryByText("Keys could not be loaded. Refresh the page to retry.")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("按邮箱搜索用户"));
    expect(await screen.findByText("无法加载用户。刷新页面重试。")).toBeInTheDocument();
    expect(screen.queryByText("Users could not be loaded. Refresh the page to retry.")).not.toBeInTheDocument();

    if (keysImpl) vi.mocked(useInfiniteKeys).mockImplementation(keysImpl);
    if (usersImpl) vi.mocked(useInfiniteUsers).mockImplementation(usersImpl);
  });

  it("renders the Chinese forward job results and hides the English ones", () => {
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    expect(screen.getByText("路由器达到或超过你当前的模型")).toBeInTheDocument();
    expect(screen.getByText("共 42 条已评判响应")).toBeInTheDocument();
    expect(screen.getByText(/路由器胜出 48\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/平局 22\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/当前模型胜出 30\.0%/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "评判结果分布" })).toBeInTheDocument();
    expect(screen.getByText("路由器成本 vs 你当前的模型")).toBeInTheDocument();
    expect(
      screen.getByText("$0.3000 vs $0.6000，基于相同的已评判轮次；已排除 2 个由缓存服务的轮次"),
    ).toBeInTheDocument();
    expect(screen.getByText("提示词难度")).toBeInTheDocument();
    expect(screen.getByText("对比对象")).toBeInTheDocument();
    expect(screen.getAllByText("已评判轮次")).toHaveLength(2);
    expect(screen.getAllByText("当前模型胜出")).toHaveLength(2);
    expect(screen.getAllByText("评判置信度")).toHaveLength(2);
    expect(screen.getAllByText("路由器成本")).toHaveLength(2);
    expect(screen.getAllByText("当前模型成本")).toHaveLength(2);
    expect(screen.getAllByText("（样本不足）")).toHaveLength(1);
    expect(screen.getByText(/已评判 42 轮次/)).toBeInTheDocument();
    expect(screen.getByText(/1 次错误/)).toBeInTheDocument();
    expect(screen.getByText(/评估支出 \$3\.21（共 \$10\.00）/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();

    expect(screen.queryByText("Router matched or beat your current model")).not.toBeInTheDocument();
    expect(screen.queryByText("Router cost vs your current model")).not.toBeInTheDocument();
    expect(screen.queryByText("Judged turns")).not.toBeInTheDocument();
    expect(screen.queryByText("Router wins")).not.toBeInTheDocument();
    expect(screen.queryByText("Current model wins")).not.toBeInTheDocument();
    expect(screen.queryByText("Ties")).not.toBeInTheDocument();
    expect(screen.queryByText("Judge confidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Current model cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt difficulty")).not.toBeInTheDocument();
    expect(screen.queryByText("Compared against")).not.toBeInTheDocument();
    expect(screen.queryByText("(low sample)")).not.toBeInTheDocument();
    expect(screen.queryByText("Stop")).not.toBeInTheDocument();
  });

  it("renders the Chinese reverse job results and hides the English ones", () => {
    const j = job({ direction: "reverse", baseline_model: "openai/gpt-4o" });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    expect(screen.getByText("路由器达到或超过基线")).toBeInTheDocument();
    expect(screen.getByText("路由器成本 vs 基线")).toBeInTheDocument();
    expect(screen.getByText("路由器选择")).toBeInTheDocument();
    expect(screen.getAllByText("基线胜出")).toHaveLength(2);
    expect(screen.getAllByText("基线成本")).toHaveLength(2);
    expect(screen.getByText(/基线胜出 48\.0%/)).toBeInTheDocument();

    expect(screen.queryByText("Router matched or beat the baseline")).not.toBeInTheDocument();
    expect(screen.queryByText("Router cost vs the baseline")).not.toBeInTheDocument();
    expect(screen.queryByText("Router pick")).not.toBeInTheDocument();
    expect(screen.queryByText("Baseline wins")).not.toBeInTheDocument();
    expect(screen.queryByText("Baseline cost")).not.toBeInTheDocument();
  });

  it("renders the Chinese per-target table and turn-budget cell", () => {
    const legacyTurnBudgetLeg = { max_budget: null, spend: 0.5, max_turns: 500, attempt_count: 3 };
    mockHooks({
      jobs: [
        job({
          targets: [
            targetEntry("hash-spent", { max_budget: 2, spend: 2, attempt_count: 40 }),
            targetEntry("hash-hungry", legacyTurnBudgetLeg),
          ],
        }),
      ],
    });
    render(<ShadowEvalSection />);

    expect(screen.getByText("目标")).toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.getByText("预算使用")).toBeInTheDocument();
    expect(screen.getAllByText("当前模型胜出").length).toBeGreaterThan(0);
    expect(screen.getByText("3 / 500 轮次")).toBeInTheDocument();
    expect(screen.getAllByText("暂无评判结果")).toHaveLength(2);

    expect(screen.queryByText("Target")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Budget used")).not.toBeInTheDocument();
    expect(screen.queryByText("No verdicts yet")).not.toBeInTheDocument();
  });

  it("renders the Chinese forward and reverse headlines and target count", () => {
    const scoped = job({ models: ["prod-claude", "prod-haiku"] });
    mockHooks({ jobs: [scoped], detailsById: { "job-1": scoped } });
    render(<ShadowEvalSection />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "对 prod-alpha 的 10% 流量通过 claude-auto 进行影子评估 模型范围：prod-claude, prod-haiku",
      ),
    ).toBeInTheDocument();

    cleanup();
    const reverse = job({ direction: "reverse", baseline_model: "openai/gpt-4o" });
    mockHooks({ jobs: [reverse], detailsById: { "job-1": reverse } });
    render(<ShadowEvalSection />);
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "在 prod-alpha 的 10% 流量上，将 claude-auto 与 openai/gpt-4o 进行对比",
      ),
    ).toBeInTheDocument();

    cleanup();
    mockHooks({
      jobs: [
        job({
          judged_count: 0,
          results: null,
          targets: [targetEntry("hash-a"), targetEntry("hash-b")],
        }),
      ],
    });
    render(<ShadowEvalSection />);
    expect(screen.getByText("2 个目标")).toBeInTheDocument();
  });

  it("renders the Chinese result empty states and hides the English ones", () => {
    mockHooks({ jobs: [job({ status: "running", results: null })] });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/正在收集评判结果/)).toBeInTheDocument();
    expect(screen.queryByText(/Collecting verdicts/)).not.toBeInTheDocument();

    cleanup();
    mockHooks({ jobs: [job({ status: "completed", judged_count: 0, results: null })] });
    render(<ShadowEvalSection />);
    expect(screen.getByText("该任务没有记录任何评判结果。")).toBeInTheDocument();
    expect(screen.queryByText("No verdicts were recorded for this job.")).not.toBeInTheDocument();

    cleanup();
    mockHooks({ jobs: [job({ status: "completed", judged_count: 12, results: null })], detailsById: {} });
    render(<ShadowEvalSection />);
    expect(screen.getByText("正在加载结果...")).toBeInTheDocument();
    expect(screen.queryByText("Loading results...")).not.toBeInTheDocument();

    cleanup();
    mockHooks({
      jobs: [job({ status: "completed", judged_count: 12, results: null })],
      detailsById: {},
      detailError: true,
    });
    render(<ShadowEvalSection />);
    expect(screen.getByText("无法加载结果。正在重试。")).toBeInTheDocument();
    expect(screen.queryByText("Results could not be loaded. Retrying.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading and list-failure messages and hides the English ones", () => {
    mockHooks({ isPending: true });
    render(<ShadowEvalSection />);
    expect(screen.getByText("正在加载评估...")).toBeInTheDocument();
    expect(screen.queryByText("Loading evaluations...")).not.toBeInTheDocument();

    cleanup();
    mockHooks({ error: new Error("boom") });
    render(<ShadowEvalSection />);
    expect(screen.getByText("无法加载已有评估。刷新页面重试。")).toBeInTheDocument();
    expect(screen.queryByText(/Existing evaluations could not be loaded/)).not.toBeInTheDocument();
  });

  it("renders the Chinese previous evaluations chrome and summary", async () => {
    const user = userEvent.setup();
    const currentOverrides: Partial<ShadowEvalJob> = {
      job_id: "job-new",
      status: "running",
      judged_count: 0,
      error_count: 0,
      results: null,
    };
    const olderOverrides: Partial<ShadowEvalJob> = {
      job_id: "job-old",
      status: "completed",
      results: null,
      judged_count: 12,
    };
    const current = job(currentOverrides);
    const older = job(olderOverrides);
    mockHooks({ jobs: [current, older], detailsById: { "job-new": current, "job-old": older } });
    render(<ShadowEvalSection />);

    const toggle = screen.getByRole("button", { name: /历史评估（1）/ });
    expect(toggle).toHaveTextContent("展开");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: /历史评估（1）/ })).toHaveTextContent("收起");
    expect(screen.getByText("查看结果")).toBeInTheDocument();
    expect(screen.getByText(/已评判 12/)).toBeInTheDocument();

    expect(screen.queryByText(/Previous evaluations \(1\)/)).not.toBeInTheDocument();
    expect(screen.queryByText("Show")).not.toBeInTheDocument();
    expect(screen.queryByText("view results")).not.toBeInTheDocument();

    cleanup();
    const countlessOverrides: Partial<ShadowEvalJob> = {
      job_id: "job-countless",
      status: "stopped",
      judged_count: 0,
      results: null,
    };
    const countless = job(countlessOverrides);
    mockHooks({
      jobs: [current, countless],
      detailsById: { "job-new": current, "job-countless": countless },
    });
    render(<ShadowEvalSection />);
    await user.click(screen.getByRole("button", { name: /历史评估（1）/ }));
    expect(screen.getByText("无评判结果")).toBeInTheDocument();
    expect(screen.queryByText("no verdicts")).not.toBeInTheDocument();
  });

  it("renders the Chinese ends-in and ending-now text and hides the English ones", () => {
    const threeDays = job({ ends_at: new Date(Date.now() + 3 * 86_400_000).toISOString() });
    mockHooks({ jobs: [threeDays], detailsById: { "job-1": threeDays } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/3 天后结束/)).toBeInTheDocument();
    expect(screen.queryByText(/ends in 3 days/)).not.toBeInTheDocument();

    cleanup();
    const withinDay = job({ ends_at: new Date(Date.now() + 12 * 3_600_000).toISOString() });
    mockHooks({ jobs: [withinDay], detailsById: { "job-1": withinDay } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/一天内结束/)).toBeInTheDocument();
    expect(screen.queryByText(/ends within a day/)).not.toBeInTheDocument();

    cleanup();
    const ended = job({ ends_at: new Date(Date.now() - 3_600_000).toISOString() });
    mockHooks({ jobs: [ended], detailsById: { "job-1": ended } });
    render(<ShadowEvalSection />);
    expect(screen.getByText(/即将结束/)).toBeInTheDocument();
    expect(screen.queryByText(/ending now/)).not.toBeInTheDocument();
  });

  it("renders the Chinese last-failure prefix and hides the English one", () => {
    const j = job({ error_count: 7, last_error: "judge call failed" });
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    expect(screen.getByText("最近失败：")).toBeInTheDocument();
    expect(screen.queryByText("Last failure:")).not.toBeInTheDocument();
  });

  /* eslint-disable testing-library/no-node-access -- The tooltip trigger is an icon with no accessible name, so reaching its portal needs the DOM */
  it("renders the Chinese cost tooltip and hides the English one", async () => {
    const user = userEvent.setup();
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    render(<ShadowEvalSection />);

    const trigger = screen.getByText("路由器成本 vs 你当前的模型").parentElement?.querySelector("svg");
    expect(trigger).toBeTruthy();
    await user.hover(trigger as SVGElement);

    expect(
      await screen.findByText(
        "每个分支按其补全成本加上自身路由分类器调用计价，均基于相同的已评判轮次；评判器的成本不计入任一分支",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Each arm is priced as its completion plus its own routing classifier call/),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese starting and stopping labels and hides the English ones", () => {
    mockHooks({});
    vi.mocked(useStartShadowEval).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useStartShadowEval>);
    render(<ShadowEvalSection />);
    expect(screen.getByRole("button", { name: "正在启动..." })).toBeInTheDocument();
    expect(screen.queryByText("Starting...")).not.toBeInTheDocument();

    cleanup();
    const j = job();
    mockHooks({ jobs: [j], detailsById: { "job-1": j } });
    vi.mocked(useStopShadowEval).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useStopShadowEval>);
    render(<ShadowEvalSection />);
    expect(screen.getByRole("button", { name: "正在停止..." })).toBeInTheDocument();
    expect(screen.queryByText("Stopping...")).not.toBeInTheDocument();
  });

  it("warns in Chinese when more than four auto-routers are picked and hides the English warning", async () => {
    const user = userEvent.setup();
    const routers = ["r1", "r2", "r3", "r4", "r5"].map((name) => ({
      model_name: name,
      litellm_params: { model: `auto_router/${name}` },
    }));
    const routersImpl = vi.mocked(useAutoRouters).getMockImplementation();
    vi.mocked(useAutoRouters).mockImplementation(
      () => ({ data: routers }) as unknown as ReturnType<typeof useAutoRouters>,
    );
    mockHooks({});
    render(<ShadowEvalSection />);

    const routerInput = screen.getByPlaceholderText("最多选择 4 个自动路由");
    for (const router of routers) {
      await user.click(routerInput);
      await user.click(await screen.findByText(router.model_name));
    }

    expect(screen.getByText("最多选择 4 个自动路由")).toBeInTheDocument();
    expect(screen.getByText("每个路由器看到相同的采样请求，并基于相同的实时响应进行评判")).toBeInTheDocument();
    expect(screen.queryByText("Pick at most 4 auto-routers")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Every router sees the same sampled requests, judged against the same live responses"),
    ).not.toBeInTheDocument();

    if (routersImpl) vi.mocked(useAutoRouters).mockImplementation(routersImpl);
  });

  it("blocks a reverse job with more than one router in Chinese and hides the English reason", async () => {
    const user = userEvent.setup();
    const routers = ["r1", "r2"].map((name) => ({
      model_name: name,
      litellm_params: { model: `auto_router/${name}` },
    }));
    const routersImpl = vi.mocked(useAutoRouters).getMockImplementation();
    vi.mocked(useAutoRouters).mockImplementation(
      () => ({ data: routers }) as unknown as ReturnType<typeof useAutoRouters>,
    );
    mockHooks({});
    render(<ShadowEvalSection />);

    const routerInput = screen.getByPlaceholderText("最多选择 4 个自动路由");
    for (const router of routers) {
      await user.click(routerInput);
      await user.click(await screen.findByText(router.model_name));
    }
    await chooseSelectOption(user, screen.getByText("采用检查：密钥流量 vs 路由器"), "回归检查：路由器选择 vs 基线");

    expect(screen.getByText("回归检查只将一个路由器与其基线对比")).toBeInTheDocument();
    expect(screen.queryByText("A regression check compares one router to its baseline")).not.toBeInTheDocument();

    if (routersImpl) vi.mocked(useAutoRouters).mockImplementation(routersImpl);
  });

  it("warns in Chinese when more than 100 models are picked and hides the English warning", async () => {
    const user = userEvent.setup();
    const names = Array.from({ length: 101 }, (_, index) => `model-${index}`);
    const groupsImpl = vi.mocked(usePlainModelGroups).getMockImplementation();
    const chatGroupsImpl = vi.mocked(usePlainChatModelGroups).getMockImplementation();
    vi.mocked(usePlainModelGroups).mockImplementation(() => new Set(names));
    vi.mocked(usePlainChatModelGroups).mockImplementation(() => new Set(names));
    mockHooks({});
    render(<ShadowEvalSection />);

    const modelInput = screen.getByPlaceholderText("目标使用的所有模型");
    for (const name of names) {
      await user.click(modelInput);
      await user.click(await screen.findByRole("option", { name }));
    }

    expect(screen.getByText("最多选择 100 个模型")).toBeInTheDocument();
    expect(screen.queryByText("Pick at most 100 models")).not.toBeInTheDocument();

    if (groupsImpl) vi.mocked(usePlainModelGroups).mockImplementation(groupsImpl);
    if (chatGroupsImpl) vi.mocked(usePlainChatModelGroups).mockImplementation(chatGroupsImpl);
  });
});
