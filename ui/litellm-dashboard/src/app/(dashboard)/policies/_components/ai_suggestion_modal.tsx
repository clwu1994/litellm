import React, { useEffect, useMemo, useState } from "react";
import type { ParseKeys } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { CheckCircle2, ChevronDown, ChevronRight, Info, XCircle } from "lucide-react";
import {
  suggestPolicyTemplates,
  modelHubCall,
  testPolicyTemplate,
  enrichPolicyTemplateStream,
} from "@/components/networking";

interface SuggestedTemplate {
  template_id: string;
  reason: string;
  template?: any;
}

interface GuardrailTestResult {
  guardrail_name: string;
  action: string;
  output_text: string;
  details: string;
}

interface AiSuggestionModalProps {
  visible: boolean;
  onSelectTemplates: (templates: any[]) => void;
  onCancel: () => void;
  accessToken: string | null;
  allTemplates: any[];
}

const MAX_EXAMPLES = 4;

const COMPLEXITY_KEYS: Record<string, ParseKeys<"policies"> | undefined> = {
  Low: "templates.complexity.low",
  Medium: "templates.complexity.medium",
  High: "templates.complexity.high",
};

const ACTION_BADGE_KEYS: Record<string, ParseKeys<"policies"> | undefined> = {
  blocked: "aiSuggestion.blocked",
  masked: "aiSuggestion.masked",
  passed: "aiSuggestion.passed",
};

const hasItems = (items?: any[]): boolean => Array.isArray(items) && items.length > 0;

const normalizeCompetitorNames = (names: string[] = []): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const name of names) {
    const trimmed = (name || "").trim();
    if (!trimmed) continue;
    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push(trimmed);
  }
  return normalized;
};

const AiSuggestionModal: React.FC<AiSuggestionModalProps> = ({
  visible,
  onSelectTemplates,
  onCancel,
  accessToken,
  allTemplates,
}) => {
  const { t } = useTranslation("policies");
  const [attackExamples, setAttackExamples] = useState<string[]>([""]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTemplate[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  // Test panel state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testInputText, setTestInputText] = useState("");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<GuardrailTestResult[] | null>(null);
  const [testOverallAction, setTestOverallAction] = useState<string | null>(null);
  const [collapsedResults, setCollapsedResults] = useState<Set<string>>(new Set());
  // Enrichment state for competitor templates
  const [enrichedDefs, setEnrichedDefs] = useState<Record<string, any[]>>({});
  const [enrichedCompetitors, setEnrichedCompetitors] = useState<Record<string, string[]>>({});
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichStatusMessage, setEnrichStatusMessage] = useState("");
  const [enrichingTemplateTitle, setEnrichingTemplateTitle] = useState<string | null>(null);
  const [enrichBrandName, setEnrichBrandName] = useState("");

  useEffect(() => {
    if (visible && availableModels.length === 0) {
      loadModels();
    }
  }, [visible]);

  const loadModels = async () => {
    if (!accessToken) return;
    setIsLoadingModels(true);
    try {
      const fetchedModels = await modelHubCall(accessToken);
      if (fetchedModels?.data?.length > 0) {
        const models = fetchedModels.data.map((item: any) => item.model_group as string).sort();
        setAvailableModels(models);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const resetState = () => {
    setAttackExamples([""]);
    setDescription("");
    setIsLoading(false);
    setSuggestions(null);
    setExplanation(null);
    setSelectedIds(new Set());
    setSelectedModel(null);
    setShowTestPanel(false);
    setTestInputText("");
    setIsTestLoading(false);
    setTestResults(null);
    setTestOverallAction(null);
    setCollapsedResults(new Set());
    setEnrichedDefs({});
    setEnrichedCompetitors({});
    setIsEnriching(false);
    setEnrichStatusMessage("");
    setEnrichingTemplateTitle(null);
    setEnrichBrandName("");
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const handleAddExample = () => {
    if (attackExamples.length < MAX_EXAMPLES) {
      setAttackExamples([...attackExamples, ""]);
    }
  };

  const handleRemoveExample = (index: number) => {
    setAttackExamples(attackExamples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, value: string) => {
    const updated = [...attackExamples];
    updated[index] = value;
    setAttackExamples(updated);
  };

  const hasInput = attackExamples.some((e) => e.trim().length > 0) || description.trim().length > 0;

  const handleSuggest = async () => {
    if (!accessToken || !hasInput || !selectedModel) return;

    setIsLoading(true);
    try {
      const result = await suggestPolicyTemplates(accessToken, attackExamples, description, selectedModel);
      setSuggestions(result.selected_templates || []);
      setExplanation(result.explanation || null);
      setSelectedIds(new Set((result.selected_templates || []).map((s: SuggestedTemplate) => s.template_id)));
    } catch {
      setSuggestions([]);
      setExplanation("Failed to get suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSuggestions(null);
    setExplanation(null);
    setSelectedIds(new Set());
    setShowTestPanel(false);
    setTestInputText("");
    setTestResults(null);
    setTestOverallAction(null);
    setCollapsedResults(new Set());
  };

  const getTemplateBySuggestion = (suggestion: SuggestedTemplate) => {
    // Prefer template payload from suggest API response; fallback to loaded catalog lookup.
    return suggestion.template || allTemplates.find((t) => t.id === suggestion.template_id);
  };

  const selectedTemplates = useMemo(() => {
    if (!suggestions) return [];

    const byId = new Map<string, any>();
    for (const suggestion of suggestions) {
      if (!selectedIds.has(suggestion.template_id)) continue;
      const template = suggestion.template || allTemplates.find((t) => t.id === suggestion.template_id);
      if (template?.id) byId.set(template.id, template);
    }
    return Array.from(byId.values());
  }, [suggestions, selectedIds, allTemplates]);

  const handleUseSelected = () => {
    const selected = selectedTemplates.map((template) => {
      const templateId = template.id;
      const enrichedGuardrailDefinitions = enrichedDefs[templateId];
      const discoveredCompetitors = enrichedCompetitors[templateId];
      const hasEnrichedGuardrailDefinitions = hasItems(enrichedGuardrailDefinitions);
      const hasDiscoveredCompetitors = hasItems(discoveredCompetitors);

      if (!hasEnrichedGuardrailDefinitions && !hasDiscoveredCompetitors) {
        return template;
      }

      return {
        ...template,
        ...(hasEnrichedGuardrailDefinitions ? { guardrailDefinitions: enrichedGuardrailDefinitions } : {}),
        ...(hasDiscoveredCompetitors ? { discoveredCompetitors: normalizeCompetitorNames(discoveredCompetitors) } : {}),
      };
    });
    resetState();
    onSelectTemplates(selected);
  };

  const toggleTemplate = (templateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const toggleResultCollapse = (name: string) => {
    setCollapsedResults((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectedTemplatesNeedingEnrichment = useMemo(
    () => selectedTemplates.filter((t) => t?.llm_enrichment),
    [selectedTemplates],
  );

  const needsEnrichment = selectedTemplatesNeedingEnrichment.length > 0;

  const allSelectedGuardrailDefs = useMemo(() => {
    const defs: any[] = [];
    for (const template of selectedTemplates) {
      const id = template.id;
      // Use enriched defs if available, otherwise use template's original
      if (hasItems(enrichedDefs[id])) {
        defs.push(...enrichedDefs[id]);
      } else {
        if (template?.guardrailDefinitions) {
          defs.push(...template.guardrailDefinitions);
        }
      }
    }
    return defs;
  }, [selectedTemplates, enrichedDefs]);

  const allSelectedGeneratedCompetitors = useMemo(() => {
    const competitors = new Set<string>();
    for (const template of selectedTemplates) {
      const templateCompetitors = normalizeCompetitorNames(enrichedCompetitors[template.id] || []);
      for (const competitor of templateCompetitors) {
        competitors.add(competitor);
      }
    }
    return Array.from(competitors);
  }, [selectedTemplates, enrichedCompetitors]);

  const hasEnrichedGuardrailsForSelection = useMemo(
    () => selectedTemplates.some((template) => hasItems(enrichedDefs[template.id])),
    [selectedTemplates, enrichedDefs],
  );

  const handleEnrichCompetitors = async () => {
    if (!accessToken || !selectedModel) return;
    const templatesToEnrich = selectedTemplatesNeedingEnrichment;
    if (templatesToEnrich.length === 0) return;

    setIsEnriching(true);
    setEnrichStatusMessage("");
    try {
      for (const template of templatesToEnrich) {
        const paramName = template.llm_enrichment.parameter;
        setEnrichingTemplateTitle(template.title);

        // Keep existing guardrails until streaming completes to avoid temporary empty payloads.
        setEnrichedDefs((prev) => {
          const { [template.id]: _removed, ...rest } = prev;
          return rest;
        });
        setEnrichedCompetitors((prev) => ({ ...prev, [template.id]: [] }));

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const finish = (cb: () => void) => {
            if (settled) return;
            settled = true;
            cb();
          };

          enrichPolicyTemplateStream(
            accessToken,
            template.id,
            { [paramName]: enrichBrandName },
            selectedModel,
            (name) => {
              setEnrichedCompetitors((prev) => {
                const existing = prev[template.id] || [];
                if (existing.some((c) => c.toLowerCase() === name.toLowerCase())) {
                  return prev;
                }
                return {
                  ...prev,
                  [template.id]: [...existing, name],
                };
              });
            },
            (result) => {
              finish(() => {
                setEnrichedDefs((prev) => ({
                  ...prev,
                  [template.id]: result.guardrailDefinitions || [],
                }));
                setEnrichedCompetitors((prev) => ({
                  ...prev,
                  [template.id]:
                    result.competitors && result.competitors.length > 0
                      ? normalizeCompetitorNames(result.competitors)
                      : prev[template.id] || [],
                }));
                resolve();
              });
            },
            (error) => {
              finish(() => reject(new Error(error)));
            },
            undefined,
            (status) => setEnrichStatusMessage(status),
          ).catch((error) => {
            finish(() => reject(error));
          });
        });
      }
    } catch (e) {
      console.error("Failed to enrich templates:", e);
    } finally {
      setIsEnriching(false);
      setEnrichStatusMessage("");
      setEnrichingTemplateTitle(null);
    }
  };

  const handleRunTest = async () => {
    if (!accessToken || !testInputText.trim()) return;
    const allDefs = allSelectedGuardrailDefs;
    if (allDefs.length === 0) return;

    setIsTestLoading(true);
    setTestResults(null);
    setTestOverallAction(null);
    setCollapsedResults(new Set());

    try {
      const result = await testPolicyTemplate(accessToken, allDefs, testInputText);
      setTestResults(result.results || []);
      setTestOverallAction(result.overall_action || "passed");
    } catch {
      setTestResults([]);
      setTestOverallAction("error");
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleTestKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleRunTest();
    }
  };

  const showResults = suggestions !== null && !isLoading;

  // Helper to render the suggestions list (reused in both layouts)
  const renderSuggestionsList = () => {
    if (!suggestions || suggestions.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">{t("aiSuggestion.noMatchingTemplates")}</p>
          <p className="text-sm mt-1">{t("aiSuggestion.noMatchingHint")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const template = getTemplateBySuggestion(suggestion);
          if (!template) return null;
          const isSelected = selectedIds.has(suggestion.template_id);
          return (
            <div
              key={suggestion.template_id}
              className={`rounded-xl border-2 transition-all ${
                isSelected ? "border-info bg-info/10 shadow-xs" : "border-border hover:border-ring hover:shadow-xs"
              }`}
            >
              <div className="p-4 cursor-pointer" onClick={() => toggleTemplate(suggestion.template_id)}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleTemplate(suggestion.template_id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{template.title}</span>
                      {template.complexity && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            template.complexity === "Low"
                              ? "bg-muted text-muted-foreground border-border"
                              : template.complexity === "Medium"
                                ? "bg-info/10 text-info border-info/15"
                                : "bg-purple-50 text-purple-500 border-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900"
                          }`}
                        >
                          {COMPLEXITY_KEYS[template.complexity] === undefined
                            ? template.complexity
                            : t(COMPLEXITY_KEYS[template.complexity])}
                        </span>
                      )}
                      {template.estimated_latency_ms != null && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                  template.estimated_latency_ms <= 1
                                    ? "border-success/20 bg-success/10 text-success"
                                    : "border-warning/20 bg-warning/10 text-warning"
                                }`}
                              />
                            }
                          >
                            {t("aiSuggestion.latencyBadge", {
                              latency: template.estimated_latency_ms <= 1 ? "<1" : template.estimated_latency_ms,
                            })}
                          </TooltipTrigger>
                          <TooltipContent>{t("aiSuggestion.latencyTooltip")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {template.guardrails &&
                        template.guardrails.slice(0, 4).map((g: string) => (
                          <span
                            key={g}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-muted text-muted-foreground"
                          >
                            {g}
                          </span>
                        ))}
                      {template.guardrails && template.guardrails.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          {t("aiSuggestion.moreGuardrails", { remainingCount: template.guardrails.length - 4 })}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-start gap-1.5">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs text-info leading-relaxed">{suggestion.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Explanation */}
        {explanation && (
          <div className="p-3 bg-muted rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("aiSuggestion.whyTheseTemplates")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper to render the test panel
  const renderTestPanel = () => {
    const generatedCompetitors = allSelectedGeneratedCompetitors;
    const hasGeneratedCompetitors = generatedCompetitors.length > 0;
    const hasEnrichedGuardrails = hasEnrichedGuardrailsForSelection;
    const showEnrichStatus = isEnriching && (enrichStatusMessage !== "" || enrichingTemplateTitle !== null);

    return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Test header */}
        <div className="pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-foreground">{t("aiSuggestion.testGuardrails")}</h3>
            <button
              onClick={() => {
                setShowTestPanel(false);
                setTestResults(null);
                setTestOverallAction(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {Array.from(selectedIds).map((id) => {
              const selectedTemplate = selectedTemplates.find((template) => template.id === id);
              return selectedTemplate ? (
                <span
                  key={id}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-info/10 text-info border border-info/20"
                >
                  {selectedTemplate.title}
                </span>
              ) : null;
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              selectedIds.size !== 1
                ? "aiSuggestion.guardrailsAcrossTemplates"
                : "aiSuggestion.guardrailsAcrossTemplate",
              { guardrailCount: allSelectedGuardrailDefs.length, templateCount: selectedIds.size },
            )}
          </p>
        </div>

        {/* Enrichment section for competitor templates */}
        {needsEnrichment && (
          <div
            className={`p-3 rounded-lg border space-y-2 ${
              hasEnrichedGuardrails ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {hasEnrichedGuardrails ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <svg className="w-4 h-4 text-warning shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className={`text-xs font-medium ${hasEnrichedGuardrails ? "text-success" : "text-warning"}`}>
                {t("aiSuggestion.enrichRequired")}
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t("aiSuggestion.brandNamePlaceholder")}
                value={enrichBrandName}
                onChange={(e) => setEnrichBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && enrichBrandName.trim() && !isEnriching) handleEnrichCompetitors();
                }}
                className="flex-1"
              />
              <Button size="sm" onClick={handleEnrichCompetitors} disabled={!enrichBrandName.trim() || isEnriching}>
                {isEnriching
                  ? t("aiSuggestion.discovering")
                  : hasEnrichedGuardrails
                    ? t("aiSuggestion.rediscover")
                    : t("aiSuggestion.discover")}
              </Button>
            </div>

            {showEnrichStatus && (
              <div className="flex items-center gap-2 rounded-sm border border-border bg-muted p-2">
                <UiLoadingSpinner className="size-3" />
                <span className="text-xs text-info">
                  {enrichStatusMessage ||
                    t("aiSuggestion.discoveringCompetitors", { templateTitle: enrichingTemplateTitle ?? "" })}
                </span>
              </div>
            )}

            {hasEnrichedGuardrails && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <span className="text-xs text-success">
                  {t("aiSuggestion.competitorsLoaded", { brandName: enrichBrandName })}
                </span>
              </div>
            )}
          </div>
        )}

        {needsEnrichment && hasGeneratedCompetitors && (
          <div className="p-3 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-info">
                {t("aiSuggestion.generatedCompetitors", { competitorCount: generatedCompetitors.length })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {generatedCompetitors.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-card text-info border border-info/20"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">{t("aiSuggestion.inputText")}</label>
                <Tooltip>
                  <TooltipTrigger render={<Info className="size-3.5 cursor-help text-muted-foreground" />} />
                  <TooltipContent>{t("aiSuggestion.inputHint")}</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("aiSuggestion.characters", { characterCount: testInputText.length })}
              </span>
            </div>
            <Textarea
              value={testInputText}
              onChange={(e) => setTestInputText(e.target.value)}
              onKeyDown={handleTestKeyDown}
              placeholder={t("aiSuggestion.inputPlaceholder")}
              rows={4}
              className="field-sizing-fixed font-mono text-sm"
            />
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">
                <Trans
                  ns="policies"
                  i18nKey="aiSuggestion.pressEnter"
                  components={{ kbd: <kbd className="rounded-sm border border-border bg-muted px-1 py-0.5 text-xs" /> }}
                />
              </span>
            </div>
          </div>
          <Button onClick={handleRunTest} disabled={!testInputText.trim() || isTestLoading} className="w-full">
            {isTestLoading
              ? t("aiSuggestion.testingGuardrails", { guardrailCount: allSelectedGuardrailDefs.length })
              : t("aiSuggestion.testGuardrailsButton", { guardrailCount: allSelectedGuardrailDefs.length })}
          </Button>
        </div>

        {/* Results */}
        {testResults &&
          testResults.length > 0 &&
          (() => {
            const blockedCount = testResults.filter((r) => r.action === "blocked").length;
            const maskedCount = testResults.filter((r) => r.action === "masked").length;
            const passedCount = testResults.filter((r) => r.action === "passed").length;
            const otherCount = testResults.length - blockedCount - maskedCount - passedCount;
            return (
              <div className="space-y-2 pt-3 border-t border-border flex-1 overflow-y-auto">
                {/* Summary bar */}
                <div className="rounded-lg border border-border bg-muted p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{t("aiSuggestion.results")}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {t("aiSuggestion.guardrailsTested", { guardrailCount: testResults.length })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {blockedCount > 0 && (
                      <div className="flex-1 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-center">
                        <div className="text-lg font-bold text-destructive">{blockedCount}</div>
                        <div className="text-[10px] font-medium text-destructive">{t("aiSuggestion.blocked")}</div>
                      </div>
                    )}
                    {maskedCount > 0 && (
                      <div className="flex-1 rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-center">
                        <div className="text-lg font-bold text-warning">{maskedCount}</div>
                        <div className="text-[10px] font-medium text-warning">{t("aiSuggestion.masked")}</div>
                      </div>
                    )}
                    <div className="flex-1 rounded-md bg-success/10 border border-success/20 px-3 py-2 text-center">
                      <div className="text-lg font-bold text-success">{passedCount}</div>
                      <div className="text-[10px] font-medium text-success">{t("aiSuggestion.passed")}</div>
                    </div>
                    {otherCount > 0 && (
                      <div className="flex-1 rounded-md bg-muted border border-border px-3 py-2 text-center">
                        <div className="text-lg font-bold text-muted-foreground">{otherCount}</div>
                        <div className="text-[10px] font-medium text-muted-foreground">{t("aiSuggestion.other")}</div>
                      </div>
                    )}
                  </div>
                </div>

                {testResults.map((result) => {
                  const isBlocked = result.action === "blocked";
                  const isMasked = result.action === "masked";
                  const isPassed = result.action === "passed";
                  const isCollapsed = collapsedResults.has(result.guardrail_name);

                  return (
                    <Card
                      key={result.guardrail_name}
                      className={`${
                        isBlocked
                          ? "bg-destructive/10 border-destructive/20"
                          : isMasked
                            ? "bg-warning/10 border-warning/20"
                            : isPassed
                              ? "bg-success/10 border-success/20"
                              : "bg-muted border-border"
                      }`}
                    >
                      <CardContent className="space-y-2 py-3">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleResultCollapse(result.guardrail_name)}
                        >
                          <div className="flex items-center space-x-1.5">
                            {isCollapsed ? (
                              <ChevronRight className="size-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-3 text-muted-foreground" />
                            )}
                            {isBlocked ? (
                              <XCircle className="size-4 text-destructive" />
                            ) : isMasked ? (
                              <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <CheckCircle2 className="size-4 text-success" />
                            )}
                            <span
                              className={`text-xs font-medium ${isBlocked ? "text-destructive" : isMasked ? "text-warning" : "text-success"}`}
                            >
                              {result.guardrail_name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                isBlocked
                                  ? "bg-destructive/15 text-destructive"
                                  : isMasked
                                    ? "bg-warning/15 text-warning"
                                    : isPassed
                                      ? "bg-success/15 text-success"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {ACTION_BADGE_KEYS[result.action] === undefined
                                ? result.action.charAt(0).toUpperCase() + result.action.slice(1)
                                : t(ACTION_BADGE_KEYS[result.action])}
                            </span>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <>
                            {isMasked && result.output_text && (
                              <div className="bg-card border border-warning/20 rounded-sm p-2">
                                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                                  {t("aiSuggestion.outputText")}
                                </label>
                                <div className="font-mono text-xs text-foreground whitespace-pre-wrap wrap-break-word">
                                  {result.output_text}
                                </div>
                              </div>
                            )}
                            {isBlocked && result.details && (
                              <div className="bg-card border border-destructive/20 rounded-sm p-2">
                                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                                  {t("aiSuggestion.details")}
                                </label>
                                <p className="text-xs text-destructive">{result.details}</p>
                              </div>
                            )}
                            {isPassed && (
                              <div className="text-[10px] text-success">{t("aiSuggestion.passedUnchanged")}</div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}

        {testResults && testResults.length === 0 && !isTestLoading && (
          <p className="py-3 text-center text-xs text-muted-foreground">{t("aiSuggestion.noTestableGuardrails")}</p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className={showTestPanel ? "gap-0 p-0 sm:max-w-300" : "gap-0 p-0 sm:max-w-205"}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <DialogTitle className="mb-1 text-xl font-semibold">{t("aiSuggestion.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {showResults
              ? t((suggestions?.length || 0) !== 1 ? "aiSuggestion.matchedTemplates" : "aiSuggestion.matchedTemplate", {
                  templateCount: suggestions?.length || 0,
                })
              : t("aiSuggestion.prompt")}
          </p>
        </div>

        <div className="border-t border-border" />

        {!showResults ? (
          /* ── Input phase ── */
          <div className="px-8 py-6 space-y-6">
            {/* Model selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("aiSuggestion.modelLabel")}
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <SearchSelect
                options={availableModels.map((m) => ({ label: m, value: m }))}
                value={selectedModel}
                onValueChange={setSelectedModel}
                placeholder={
                  isLoadingModels ? t("templateModal.loadingModels") : t("aiSuggestion.selectModelPlaceholder")
                }
                emptyText={t("templateModal.noModelsFound")}
                disabled={isLoadingModels}
              />
            </div>

            {/* Attack examples */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("aiSuggestion.attackExamplesLabel")}
              </label>
              <div className="space-y-2">
                {attackExamples.map((example, index) => (
                  <div key={index} className="relative group">
                    <textarea
                      className="w-full rounded-lg border border-border px-3.5 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-info focus:ring-1 focus:ring-ring overflow-hidden"
                      rows={1}
                      style={{ minHeight: "40px", resize: "none" }}
                      placeholder={
                        index === 0
                          ? t("aiSuggestion.examplePrompt1")
                          : index === 1
                            ? t("aiSuggestion.examplePrompt2")
                            : index === 2
                              ? t("aiSuggestion.examplePrompt3")
                              : t("aiSuggestion.examplePrompt4")
                      }
                      value={example}
                      onChange={(e) => {
                        handleExampleChange(index, e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      onFocus={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                    />
                    {attackExamples.length > 1 && (
                      <button
                        onClick={() => handleRemoveExample(index)}
                        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {attackExamples.length < MAX_EXAMPLES && (
                <button onClick={handleAddExample} className="text-sm text-info hover:text-info/80 mt-2 font-medium">
                  {t("aiSuggestion.addExample")}
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("aiSuggestion.descriptionLabel")}
              </label>
              <textarea
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-info focus:ring-1 focus:ring-ring overflow-hidden"
                rows={1}
                style={{ minHeight: "60px", resize: "none" }}
                placeholder={t("aiSuggestion.descriptionPlaceholder")}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onFocus={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-3.5 bg-info/10 rounded-lg border border-info/15">
              <svg className="w-4 h-4 text-info mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-info">{t("aiSuggestion.infoBox")}</p>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted p-4">
                <UiLoadingSpinner className="size-4" />
                <span className="text-sm text-muted-foreground">{t("aiSuggestion.analyzingRequirements")}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
                {t("templateModal.cancel")}
              </Button>
              <Button onClick={handleSuggest} disabled={!hasInput || !selectedModel || isLoading}>
                {isLoading ? t("aiSuggestion.analyzing") : t("aiSuggestion.suggestPolicies")}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Results phase ── */
          <div className="px-8 py-6">
            {showTestPanel && selectedIds.size > 0 ? (
              /* Side-by-side layout: suggestions left, test panel right */
              <div className="flex gap-6" style={{ minHeight: "500px", maxHeight: "70vh" }}>
                {/* Left: suggestions */}
                <div className="w-1/2 overflow-y-auto pr-2">{renderSuggestionsList()}</div>
                {/* Right: test panel */}
                <div className="w-1/2 border-l border-border pl-6 overflow-y-auto">{renderTestPanel()}</div>
              </div>
            ) : (
              /* Normal single-column layout */
              <div className="max-h-[520px] overflow-y-auto pr-1">{renderSuggestionsList()}</div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
              <Button variant="secondary" onClick={handleBack}>
                {t("aiSuggestion.back")}
              </Button>
              {suggestions && suggestions.length > 0 && selectedIds.size > 0 && !showTestPanel && (
                <Button variant="secondary" onClick={() => setShowTestPanel(true)}>
                  {t("aiSuggestion.testSuggestions")}
                </Button>
              )}
              <Button onClick={handleUseSelected} disabled={selectedIds.size === 0 || isEnriching}>
                {t(selectedIds.size !== 1 ? "aiSuggestion.useSelectedTemplates" : "aiSuggestion.useSelectedTemplate", {
                  selectedCount: selectedIds.size,
                })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiSuggestionModal;
