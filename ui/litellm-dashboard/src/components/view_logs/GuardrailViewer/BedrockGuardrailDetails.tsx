import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export type BedrockGuardrailAction = "NONE" | "GUARDRAIL_INTERVENED";

export interface BedrockGuardrailUsage {
  wordPolicyUnits?: number;
  topicPolicyUnits?: number;
  contentPolicyUnits?: number;
  contentPolicyImageUnits?: number;
  automatedReasoningPolicies?: number;
  automatedReasoningPolicyUnits?: number;
  contextualGroundingPolicyUnits?: number;
  sensitiveInformationPolicyUnits?: number;
  sensitiveInformationPolicyFreeUnits?: number;
}

export interface BedrockGuardrailCoverageDim {
  total?: number;
  guarded?: number;
}

export interface BedrockGuardrailCoverage {
  images?: BedrockGuardrailCoverageDim;
  textCharacters?: BedrockGuardrailCoverageDim;
}

export interface BedrockWordItem {
  action?: string; // e.g., "BLOCKED" or "ALLOWED"
  detected?: boolean;
  match?: string;
  type?: string; // present on managedWordLists entries
}

export interface BedrockContentFilter {
  type?: string; // e.g. "HATE", etc.
  action?: string; // "BLOCKED" | "NONE" (varies by config)
  detected?: boolean;
  filterStrength?: string; // e.g., "HIGH"/"MEDIUM"/"LOW"
  confidence?: string; // e.g., "HIGH"/"MEDIUM"/"LOW"
}

export interface BedrockContextualGroundingFilter {
  type?: string; // "GROUNDING" | "RELEVANCE"
  action?: string; // "BLOCKED" | ...
  detected?: boolean;
  score?: number; // model score
  threshold?: number; // configured threshold
}

export interface BedrockPiiEntity {
  type?: string; // e.g., "ADDRESS", "EMAIL", etc.
  match?: string; // the matched text (may be masked)
  detected?: boolean;
  action?: string; // "BLOCKED" | "ANONYMIZED" | ...
}

export interface BedrockRegexFinding {
  name?: string;
  regex?: string;
  match?: string;
  detected?: boolean;
  action?: string;
}

export interface BedrockTopic {
  name?: string; // topic list entry name
  type?: string; // "DENY" | "ALLOW" depending on list
  detected?: boolean;
  action?: string; // "BLOCKED" | "NONE"
}

export interface BedrockInvocationMetrics {
  usage?: BedrockGuardrailUsage;
  guardrailCoverage?: BedrockGuardrailCoverage;
  guardrailProcessingLatency?: number; // in ms
}

export interface BedrockAssessment {
  wordPolicy?: { customWords?: BedrockWordItem[]; managedWordLists?: BedrockWordItem[] };
  contentPolicy?: { filters?: BedrockContentFilter[] };
  topicPolicy?: { topics?: BedrockTopic[] };
  sensitiveInformationPolicy?: { piiEntities?: BedrockPiiEntity[]; regexes?: BedrockRegexFinding[] };
  contextualGroundingPolicy?: { filters?: BedrockContextualGroundingFilter[] };
  automatedReasoningPolicy?: { findings?: any[] };
  invocationMetrics?: BedrockInvocationMetrics;
}

export interface BedrockOutputContent {
  text?: string;
}

export interface BedrockGuardrailResponse {
  action?: BedrockGuardrailAction;
  actionReason?: string | null;
  outputs?: BedrockOutputContent[];
  output?: BedrockOutputContent[];
  usage?: BedrockGuardrailUsage;
  guardrailCoverage?: BedrockGuardrailCoverage;
  assessments?: BedrockAssessment[];
  blockedResponse?: string;
}

/** ====== UI helpers ====== */
type ChipTone = "green" | "red" | "blue" | "slate" | "amber";

const chip = (text: React.ReactNode, tone: ChipTone = "slate") => {
  const map: Record<ChipTone, string> = {
    green: "bg-success/15 text-success",
    red: "bg-destructive/15 text-destructive",
    blue: "bg-info/10 text-info",
    slate: "bg-muted text-foreground",
    amber: "bg-warning/15 text-warning",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium inline-block ${map[tone]}`}>{text}</span>;
};

const boolPill = (b: boolean | undefined, t: TFunction<"logs">) =>
  b ? chip(t("guardrail.bedrock.detected"), "red") : chip(t("guardrail.bedrock.notDetected"), "slate");

interface SectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, count, defaultOpen = true, right, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-muted cursor-pointer hover:bg-accent"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center">
          <svg
            className={`w-5 h-5 mr-2 transition-transform ${open ? "transform rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h5 className="font-medium">
            {title} {typeof count === "number" && <span className="text-muted-foreground font-normal">({count})</span>}
          </h5>
        </div>
        <div>{right}</div>
      </div>
      {open && <div className="p-3 border-t bg-card">{children}</div>}
    </div>
  );
};

interface KVProps {
  label: string;
  children?: React.ReactNode;
  mono?: boolean;
}

const KV: React.FC<KVProps> = ({ label, children, mono }) => (
  <div className="flex">
    <span className="font-medium w-1/3">{label}</span>
    <span className={mono ? "font-mono text-sm break-all" : ""}>{children}</span>
  </div>
);

const Divider: React.FC = () => <div className="my-3 border-t" />;

/** ====== Main component ====== */
export const BedrockGuardrailDetails: React.FC<{ response: BedrockGuardrailResponse }> = ({ response }) => {
  const { t } = useTranslation("logs");
  if (!response) return null;

  const outputs: BedrockOutputContent[] = (response.outputs ?? response.output ?? []) as BedrockOutputContent[];

  const actionTone: "green" | "red" = response.action === "GUARDRAIL_INTERVENED" ? "red" : "green";

  const coverageChips = (
    <div className="flex flex-wrap gap-2">
      {response.guardrailCoverage?.textCharacters &&
        chip(
          t("guardrail.bedrock.textGuarded", {
            guarded: response.guardrailCoverage.textCharacters.guarded ?? 0,
            total: response.guardrailCoverage.textCharacters.total ?? 0,
          }),
          "blue",
        )}
      {response.guardrailCoverage?.images &&
        chip(
          t("guardrail.bedrock.imagesGuarded", {
            guarded: response.guardrailCoverage.images.guarded ?? 0,
            total: response.guardrailCoverage.images.total ?? 0,
          }),
          "blue",
        )}
    </div>
  );

  const usagePills = response.usage && (
    <div className="flex flex-wrap gap-2">
      {Object.entries(response.usage).map(([k, v]) =>
        typeof v === "number" ? (
          <span key={k} className="px-2 py-1 bg-muted text-foreground rounded-md text-xs font-medium">
            {k}: {v}
          </span>
        ) : null,
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Top summary card */}
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <KV label={t("guardrail.bedrock.action")}>
              {chip(response.action ?? t("guardrail.bedrock.na"), actionTone)}
            </KV>
            {response.actionReason && <KV label={t("guardrail.bedrock.actionReason")}>{response.actionReason}</KV>}
            {response.blockedResponse && (
              <KV label={t("guardrail.bedrock.blockedResponse")}>
                <span className="italic">{response.blockedResponse}</span>
              </KV>
            )}
          </div>
          <div className="space-y-2">
            <KV label={t("guardrail.bedrock.coverage")}>{coverageChips}</KV>
            <KV label={t("guardrail.bedrock.usage")}>{usagePills}</KV>
          </div>
        </div>

        {/* Outputs */}
        {outputs.length > 0 && (
          <>
            <Divider />
            <h4 className="font-medium mb-2">{t("guardrail.bedrock.outputs")}</h4>
            <div className="space-y-2">
              {outputs.map((o, i) => (
                <div key={i} className="p-3 bg-muted rounded-md">
                  <div className="text-sm whitespace-pre-wrap">
                    {o.text ?? <em>{t("guardrail.bedrock.nonTextOutput")}</em>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assessments */}
      {response.assessments?.length ? (
        <div className="space-y-3">
          {response.assessments.map((assess, idx) => {
            const policyBadges = (
              <div className="flex flex-wrap gap-1">
                {assess.wordPolicy && chip(t("guardrail.bedrock.policy.word"), "slate")}
                {assess.contentPolicy && chip(t("guardrail.bedrock.policy.content"), "slate")}
                {assess.topicPolicy && chip(t("guardrail.bedrock.policy.topic"), "slate")}
                {assess.sensitiveInformationPolicy && chip(t("guardrail.bedrock.policy.sensitiveInfo"), "slate")}
                {assess.contextualGroundingPolicy && chip(t("guardrail.bedrock.policy.contextualGrounding"), "slate")}
                {assess.automatedReasoningPolicy && chip(t("guardrail.bedrock.policy.automatedReasoning"), "slate")}
              </div>
            );

            return (
              <Section
                key={idx}
                title={t("guardrail.bedrock.assessment", { index: idx + 1 })}
                defaultOpen
                right={
                  <div className="flex items-center gap-3">
                    {assess.invocationMetrics?.guardrailProcessingLatency != null &&
                      chip(`${assess.invocationMetrics.guardrailProcessingLatency} ms`, "amber")}
                    {policyBadges}
                  </div>
                }
              >
                {/* Word policy */}
                {assess.wordPolicy && (
                  <div className="mb-3">
                    <h6 className="font-medium mb-2">{t("guardrail.bedrock.wordPolicy")}</h6>
                    {(assess.wordPolicy.customWords?.length ?? 0) > 0 && (
                      <Section title={t("guardrail.bedrock.customWords")} defaultOpen>
                        <div className="space-y-2">
                          {assess.wordPolicy.customWords!.map((w, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded-sm">
                              <div className="flex items-center gap-2">
                                {chip(w.action ?? t("guardrail.bedrock.na"), w.detected ? "red" : "slate")}
                                <span className="font-mono text-sm break-all">{w.match}</span>
                              </div>
                              {boolPill(w.detected, t)}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {(assess.wordPolicy.managedWordLists?.length ?? 0) > 0 && (
                      <Section title={t("guardrail.bedrock.managedWordLists")} defaultOpen={false}>
                        <div className="space-y-2">
                          {assess.wordPolicy.managedWordLists!.map((w, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded-sm">
                              <div className="flex items-center gap-2">
                                {chip(w.action ?? t("guardrail.bedrock.na"), w.detected ? "red" : "slate")}
                                <span className="font-mono text-sm break-all">{w.match}</span>
                                {w.type && chip(w.type, "slate")}
                              </div>
                              {boolPill(w.detected, t)}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                )}

                {/* Content policy */}
                {assess.contentPolicy?.filters?.length ? (
                  <div className="mb-3">
                    <h6 className="font-medium mb-2">{t("guardrail.bedrock.contentPolicy")}</h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.type")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.action")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.detected")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.strength")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.confidence")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assess.contentPolicy.filters!.map((f, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-1 pr-4">{f.type ?? "—"}</td>
                              <td className="py-1 pr-4">{chip(f.action ?? "—", f.detected ? "red" : "slate")}</td>
                              <td className="py-1 pr-4">{boolPill(f.detected, t)}</td>
                              <td className="py-1 pr-4">{f.filterStrength ?? "—"}</td>
                              <td className="py-1 pr-4">{f.confidence ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Contextual grounding */}
                {assess.contextualGroundingPolicy?.filters?.length ? (
                  <div className="mb-3">
                    <h6 className="font-medium mb-2">{t("guardrail.bedrock.contextualGrounding")}</h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.type")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.action")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.detected")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.score")}</th>
                            <th className="py-1 pr-4">{t("guardrail.bedrock.table.threshold")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assess.contextualGroundingPolicy.filters!.map((f, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-1 pr-4">{f.type ?? "—"}</td>
                              <td className="py-1 pr-4">{chip(f.action ?? "—", f.detected ? "red" : "slate")}</td>
                              <td className="py-1 pr-4">{boolPill(f.detected, t)}</td>
                              <td className="py-1 pr-4">{f.score ?? "—"}</td>
                              <td className="py-1 pr-4">{f.threshold ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Sensitive Information */}
                {assess.sensitiveInformationPolicy && (
                  <div className="mb-3">
                    <h6 className="font-medium mb-2">{t("guardrail.bedrock.sensitiveInformation")}</h6>
                    {(assess.sensitiveInformationPolicy.piiEntities?.length ?? 0) > 0 && (
                      <Section title={t("guardrail.bedrock.piiEntities")} defaultOpen>
                        <div className="space-y-2">
                          {assess.sensitiveInformationPolicy.piiEntities!.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded-sm">
                              <div className="flex items-center gap-2">
                                {chip(p.action ?? t("guardrail.bedrock.na"), p.detected ? "red" : "slate")}
                                {p.type && chip(p.type, "slate")}
                                <span className="font-mono text-xs break-all">{p.match}</span>
                              </div>
                              {boolPill(p.detected, t)}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {(assess.sensitiveInformationPolicy.regexes?.length ?? 0) > 0 && (
                      <Section title={t("guardrail.bedrock.customRegexes")} defaultOpen={false}>
                        <div className="space-y-2">
                          {assess.sensitiveInformationPolicy.regexes!.map((r, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-muted rounded-sm gap-1"
                            >
                              <div className="flex items-center gap-2">
                                {chip(r.action ?? t("guardrail.bedrock.na"), r.detected ? "red" : "slate")}
                                <span className="font-medium">{r.name ?? t("guardrail.bedrock.regexFallback")}</span>
                                <span className="font-mono text-xs break-all">{r.regex}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {boolPill(r.detected, t)}
                                {r.match && <span className="font-mono text-xs break-all">{r.match}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                )}

                {/* Topic policy */}
                {assess.topicPolicy?.topics?.length ? (
                  <div className="mb-3">
                    <h6 className="font-medium mb-2">{t("guardrail.bedrock.topicPolicy")}</h6>
                    <div className="flex flex-wrap gap-2">
                      {assess.topicPolicy.topics!.map((topic, i) => (
                        <div key={i} className="px-3 py-1.5 bg-muted rounded-md text-xs">
                          <div className="flex items-center gap-2">
                            {chip(topic.action ?? t("guardrail.bedrock.na"), topic.detected ? "red" : "slate")}
                            <span className="font-medium">{topic.name ?? t("guardrail.bedrock.topicFallback")}</span>
                            {topic.type && chip(topic.type, "slate")}
                            {boolPill(topic.detected, t)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Invocation metrics */}
                {assess.invocationMetrics && (
                  <Section title={t("guardrail.bedrock.invocationMetrics")} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <KV label={t("guardrail.bedrock.latency")}>
                          {assess.invocationMetrics.guardrailProcessingLatency ?? "—"}
                        </KV>
                        <KV label={t("guardrail.bedrock.coverage")}>
                          <div className="flex flex-wrap gap-2">
                            {assess.invocationMetrics.guardrailCoverage?.textCharacters &&
                              chip(
                                t("guardrail.bedrock.text", {
                                  guarded: assess.invocationMetrics.guardrailCoverage.textCharacters.guarded ?? 0,
                                  total: assess.invocationMetrics.guardrailCoverage.textCharacters.total ?? 0,
                                }),
                                "blue",
                              )}
                            {assess.invocationMetrics.guardrailCoverage?.images &&
                              chip(
                                t("guardrail.bedrock.images", {
                                  guarded: assess.invocationMetrics.guardrailCoverage.images.guarded ?? 0,
                                  total: assess.invocationMetrics.guardrailCoverage.images.total ?? 0,
                                }),
                                "blue",
                              )}
                          </div>
                        </KV>
                      </div>
                      <div className="space-y-2">
                        <KV label={t("guardrail.bedrock.usage")}>
                          <div className="flex flex-wrap gap-2">
                            {assess.invocationMetrics.usage &&
                              Object.entries(assess.invocationMetrics.usage).map(([k, v]) =>
                                typeof v === "number" ? (
                                  <span
                                    key={k}
                                    className="px-2 py-1 bg-muted text-foreground rounded-md text-xs font-medium"
                                  >
                                    {k}: {v}
                                  </span>
                                ) : null,
                              )}
                          </div>
                        </KV>
                      </div>
                    </div>
                  </Section>
                )}

                {/* Automated reasoning (fallback render) */}
                {assess.automatedReasoningPolicy?.findings?.length ? (
                  <Section title={t("guardrail.bedrock.automatedReasoningFindings")} defaultOpen={false}>
                    <div className="space-y-2">
                      {assess.automatedReasoningPolicy.findings!.map((f, i) => (
                        <pre key={i} className="bg-muted rounded-sm p-2 text-xs overflow-x-auto">
                          {JSON.stringify(f, null, 2)}
                        </pre>
                      ))}
                    </div>
                  </Section>
                ) : null}
              </Section>
            );
          })}
        </div>
      ) : null}

      {/* Raw JSON (for debugging / completeness) */}
      <Section title={t("guardrail.bedrock.rawResponse")} defaultOpen={false}>
        <pre className="bg-muted rounded-sm p-3 text-xs overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
      </Section>
    </div>
  );
};

export default BedrockGuardrailDetails;
