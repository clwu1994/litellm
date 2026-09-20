"use client";

import React, { useMemo, useState } from "react";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";

import { useInfiniteKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  useAutoRouters,
  usePlainChatModelDeployments,
  usePlainChatModelGroups,
  usePlainModelGroups,
} from "@/app/(dashboard)/hooks/models/useModels";
import { buildModelAvailability, deploymentRefsFromModelInfo, resolveAvailableModels } from "@/lib/autorouter_presets";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PaginatedMultiSelect } from "@/components/shared/PaginatedMultiSelect";
import TeamMultiSelect from "@/components/common_components/team_multi_select";
import { userOptionLabel } from "@/components/common_components/UserDropdown";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useStartShadowEval, type ShadowEvalJob } from "./useShadowEval";

type ShadowEvalDirection = ShadowEvalJob["direction"];

const MAX_ROUTERS = 4;
const MAX_MODELS = 100;
const RECOMMENDED_JUDGE_MODELS = ["anthropic/claude-sonnet-5", "openai/gpt-4o", "gemini/gemini-2.5-pro"] as const;

const DIRECTION_OPTIONS: readonly { value: ShadowEvalDirection; labelKey: ParseKeys<"costTracking"> }[] = [
  { value: "forward", labelKey: "shadowEval.direction.forward" },
  { value: "reverse", labelKey: "shadowEval.direction.reverse" },
] as const;

const START_FORM_DESCRIPTION: Record<ShadowEvalDirection, ParseKeys<"costTracking">> = {
  forward: "shadowEval.descriptionForward",
  reverse: "shadowEval.descriptionReverse",
};

const DURATION_OPTIONS = ["1", "3", "7", "14", "30"] as const;

const Field: React.FC<{ label: string; htmlFor?: string; className?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  className,
  children,
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label htmlFor={htmlFor} className="text-xs">
      {label}
    </Label>
    {children}
  </div>
);

const KeySelect: React.FC<{ value: string[]; onChange: (tokens: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation("costTracking");
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteKeys(50, {
    selectedKeyAlias: search || null,
  });
  const options = useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.keys)
        .map((key) => ({
          label: key.key_alias || key.key_name || key.token,
          value: key.token,
          sublabel: key.token,
        })),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-key"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("shadowEval.keyPlaceholder")}
      emptyText={t("shadowEval.noMatchingKeys")}
      errorText={isError ? t("shadowEval.keysLoadError") : undefined}
    />
  );
};

const UserSelect: React.FC<{ value: string[]; onChange: (ids: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation("costTracking");
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteUsers(
    50,
    search || undefined,
  );
  const options = useMemo<SearchSelectOption[]>(
    () =>
      Array.from(
        new Map(
          (data?.pages ?? [])
            .flatMap((page) => page.users)
            .map((user) => [user.user_id, { label: userOptionLabel(user), value: user.user_id }] as const),
        ).values(),
      ),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-user"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("shadowEval.userPlaceholder")}
      emptyText={t("shadowEval.noMatchingUsers")}
      errorText={isError ? t("shadowEval.usersLoadError") : undefined}
    />
  );
};

const RouterField: React.FC<{
  options: SearchSelectOption[];
  routerNames: string[];
  onChange: (names: string[]) => void;
  direction: ShadowEvalDirection;
}> = ({ options, routerNames, onChange, direction }) => {
  const { t } = useTranslation("costTracking");
  return (
    <Field label={t("shadowEval.autoRoutersLabel")}>
      <MultiSelect
        options={options}
        value={routerNames}
        onValueChange={onChange}
        placeholder={t("shadowEval.routerPlaceholder")}
        emptyText={t("shadowEval.noAutoRouters")}
      />
      {routerNames.length > MAX_ROUTERS && (
        <p className="text-xs text-destructive">{t("shadowEval.tooManyRouters", { max: MAX_ROUTERS })}</p>
      )}
      {direction === "reverse" && routerNames.length > 1 && (
        <p className="text-xs text-destructive">{t("shadowEval.reverseSingleRouter")}</p>
      )}
      {direction === "forward" && routerNames.length > 1 && (
        <p className="text-xs text-muted-foreground">{t("shadowEval.forwardSharedRouters")}</p>
      )}
    </Field>
  );
};

interface StartFormValidityInputs {
  accessToken: string | null | undefined;
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  judgeModel: string | null;
  percentage: string;
  maxBudget: string;
}

const startFormValidity = (inputs: StartFormValidityInputs) => {
  const parsedPct = Number.parseFloat(inputs.percentage);
  const percentageValid = parsedPct >= 0.1 && parsedPct <= 100;
  const parsedMaxBudget = Number.parseFloat(inputs.maxBudget);
  const maxBudgetValid = parsedMaxBudget >= 0.01 && parsedMaxBudget <= 10000;
  const baselinePicked = inputs.direction === "forward" || Boolean(inputs.baselineModel);
  const targetsPicked = inputs.apiKeyIds.length + inputs.teamIds.length + inputs.userIds.length > 0;
  const routerCountValid = inputs.routerNames.length >= 1 && inputs.routerNames.length <= MAX_ROUTERS;
  const routersMatchDirection = inputs.direction === "forward" || inputs.routerNames.length === 1;
  const routersValid = routerCountValid && routersMatchDirection;
  const scopeValid = routersValid && (inputs.direction === "reverse" || inputs.models.length <= MAX_MODELS);
  const modelsPicked = scopeValid && Boolean(inputs.judgeModel) && baselinePicked;
  const filled = targetsPicked && modelsPicked;
  const boundsValid = percentageValid && maxBudgetValid;
  const valid = Boolean(inputs.accessToken) && filled && boundsValid;
  return { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid };
};

interface StartBodyInputs {
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  shadowPercentage: number;
  durationDays: number;
  maxBudget: number;
  judgeModel: string;
}

const buildStartBody = (inputs: StartBodyInputs) => ({
  api_key_ids: inputs.apiKeyIds,
  team_ids: inputs.teamIds,
  user_ids: inputs.userIds,
  models: inputs.direction === "forward" ? inputs.models : [],
  router_names: inputs.routerNames,
  direction: inputs.direction,
  ...(inputs.direction === "reverse" ? { baseline_model: inputs.baselineModel ?? undefined } : {}),
  shadow_percentage: inputs.shadowPercentage,
  duration_days: inputs.durationDays,
  max_budget: inputs.maxBudget,
  judge_model: inputs.judgeModel,
});

export const StartForm: React.FC = () => {
  const { t } = useTranslation("costTracking");
  const { accessToken } = useAuthorized();
  const [apiKeyIds, setApiKeyIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [routerNames, setRouterNames] = useState<string[]>([]);
  const [direction, setDirection] = useState<ShadowEvalDirection>("forward");
  const [baselineModel, setBaselineModel] = useState<string | null>(null);
  const [percentage, setPercentage] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [judgeModel, setJudgeModel] = useState<string | null>(null);
  const [maxBudget, setMaxBudget] = useState("10");
  const { data: autoRouters } = useAutoRouters();
  const configuredGroups = usePlainModelGroups();
  const chatGroups = usePlainChatModelGroups();
  const chatDeployments = usePlainChatModelDeployments();
  const modelOptions = useMemo<SearchSelectOption[]>(
    () => [...configuredGroups].toSorted((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name })),
    [configuredGroups],
  );
  const chatOptions = useMemo(
    () => modelOptions.filter((option) => chatGroups.has(option.value)),
    [modelOptions, chatGroups],
  );
  const chatAvailability = useMemo(
    () => buildModelAvailability(chatGroups, deploymentRefsFromModelInfo(chatDeployments)),
    [chatDeployments, chatGroups],
  );
  const recommendedJudgeModels = useMemo(
    () => new Set(RECOMMENDED_JUDGE_MODELS.flatMap((model) => resolveAvailableModels(model, chatAvailability))),
    [chatAvailability],
  );
  const judgeOptions = useMemo(
    () =>
      chatOptions.map((option) =>
        recommendedJudgeModels.has(option.value) ? { ...option, sublabel: t("shadowEval.recommended") } : option,
      ),
    [chatOptions, recommendedJudgeModels, t],
  );
  const start = useStartShadowEval();

  const routerOptions = useMemo<SearchSelectOption[]>(() => {
    const names = new Set(
      (autoRouters ?? []).map((deployment) => deployment.model_name).filter((name): name is string => Boolean(name)),
    );
    return [...names].toSorted().map((name) => ({ label: name, value: name }));
  }, [autoRouters]);

  const validityInputs: StartFormValidityInputs = {
    accessToken,
    apiKeyIds,
    teamIds,
    userIds,
    models,
    routerNames,
    direction,
    baselineModel,
    judgeModel,
    percentage,
    maxBudget,
  };
  const { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid } = startFormValidity(validityInputs);
  const handleStart = () => {
    if (!valid || !judgeModel) return;
    const bodyInputs: StartBodyInputs = {
      apiKeyIds,
      teamIds,
      userIds,
      models,
      routerNames,
      direction,
      baselineModel,
      shadowPercentage: parsedPct,
      durationDays: Number.parseInt(durationDays, 10),
      maxBudget: parsedMaxBudget,
      judgeModel,
    };
    start.mutate(buildStartBody(bodyInputs));
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">{t("shadowEval.startTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t(START_FORM_DESCRIPTION[direction])}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("shadowEval.directionLabel")}>
            <Select
              value={direction}
              onValueChange={(v: string | null) => setDirection(v === "reverse" ? "reverse" : "forward")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {t((DIRECTION_OPTIONS.find((o) => o.value === direction) ?? DIRECTION_OPTIONS[0]).labelKey)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("shadowEval.keysToShadow")} htmlFor="shadow-eval-key">
            <KeySelect value={apiKeyIds} onChange={setApiKeyIds} />
          </Field>
          <Field label={t("shadowEval.teamsToShadow")}>
            <TeamMultiSelect value={teamIds} onChange={setTeamIds} placeholder={t("shadowEval.teamPlaceholder")} />
          </Field>
          <Field label={t("shadowEval.usersToShadow")} htmlFor="shadow-eval-user">
            <UserSelect value={userIds} onChange={setUserIds} />
          </Field>
          {direction === "forward" && (
            <Field label={t("shadowEval.onlyOnModels")}>
              <MultiSelect
                options={modelOptions}
                value={models}
                onValueChange={setModels}
                placeholder={t("shadowEval.everyModelPlaceholder")}
                emptyText={t("shadowEval.noModelsConfigured")}
              />
              {models.length > MAX_MODELS ? (
                <p className="text-xs text-destructive">{t("shadowEval.tooManyModels", { max: MAX_MODELS })}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("shadowEval.modelsScopeHint")}</p>
              )}
            </Field>
          )}
          <RouterField
            options={routerOptions}
            routerNames={routerNames}
            onChange={setRouterNames}
            direction={direction}
          />
          <Field label={t("shadowEval.trafficSampled")} htmlFor="shadow-eval-pct">
            <div className="flex items-center gap-2">
              <Input
                id="shadow-eval-pct"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                className="w-24"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("shadowEval.percentOfTraffic")}</span>
            </div>
            <div>
              {percentage.trim() !== "" && !percentageValid && (
                <p className="text-xs text-destructive">{t("shadowEval.percentageRange")}</p>
              )}
            </div>
          </Field>
          <Field label={t("shadowEval.durationLabel")}>
            <Select value={durationDays} onValueChange={(v: string | null) => setDurationDays(v ?? "7")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {t("shadowEval.durationDays", {
                    days: DURATION_OPTIONS.find((o) => o === durationDays) ?? "7",
                  })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t("shadowEval.durationDays", { days: option })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("shadowEval.spendBudget")}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0.01}
                max={10000}
                step={0.01}
                className="w-24"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("shadowEval.maxSpendHint")}</span>
            </div>
            {maxBudget.trim() !== "" && !maxBudgetValid && (
              <p className="text-xs text-destructive">{t("shadowEval.budgetRange")}</p>
            )}
          </Field>
          {direction === "reverse" && (
            <Field label={t("shadowEval.baselineModel")}>
              <SearchSelect
                options={chatOptions}
                value={baselineModel}
                onValueChange={setBaselineModel}
                placeholder={t("shadowEval.baselinePlaceholder")}
                emptyText={t("shadowEval.noChatModels")}
              />
            </Field>
          )}
          <Field label={t("shadowEval.judgeModel")} className="sm:col-span-2">
            <SearchSelect
              options={judgeOptions}
              value={judgeModel}
              onValueChange={setJudgeModel}
              placeholder={t("shadowEval.judgePlaceholder")}
              emptyText={t("shadowEval.noChatModels")}
            />
          </Field>
        </div>
        <Button disabled={!valid || start.isPending} onClick={handleStart}>
          {start.isPending ? t("shadowEval.starting") : t("shadowEval.startButton")}
        </Button>
      </CardContent>
    </Card>
  );
};
