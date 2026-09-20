import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import AddGuardrailForm from "./add_guardrail_form";
import { Logo } from "@/components/molecules/logo/Logo";
import { GUARDRAIL_PRESETS } from "./guardrail_garden_configs";
import { GuardrailCardInfo } from "./guardrail_garden_data";

interface GuardrailDetailViewProps {
  card: GuardrailCardInfo;
  onBack: () => void;
  accessToken: string | null;
  onGuardrailCreated: () => void;
}

const GuardrailDetailView: React.FC<GuardrailDetailViewProps> = ({ card, onBack, accessToken, onGuardrailCreated }) => {
  const { t } = useTranslation("guardrails");
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const detailRows = [
    {
      property: t("garden.detail.provider"),
      value: card.category === "litellm" ? t("garden.detail.litellmProvider") : t("garden.detail.partnerProvider"),
    },
    ...(card.subcategoryKey ? [{ property: t("garden.detail.subcategory"), value: t(card.subcategoryKey) }] : []),
    ...(card.category === "litellm"
      ? [{ property: t("garden.detail.cost"), value: t("garden.detail.costValue") }]
      : []),
    ...(card.category === "litellm"
      ? [{ property: t("garden.detail.externalDependencies"), value: t("garden.detail.none") }]
      : []),
    ...(card.category === "litellm"
      ? [{ property: t("garden.detail.latency"), value: card.eval?.latency || t("garden.detail.latencyFallback") }]
      : []),
  ];

  const evalRows = card.eval
    ? [
        { metric: t("garden.detail.precision"), value: `${card.eval.precision}%` },
        { metric: t("garden.detail.recall"), value: `${card.eval.recall}%` },
        { metric: t("garden.detail.f1Score"), value: `${card.eval.f1}%` },
        { metric: t("garden.detail.testCases"), value: String(card.eval.testCases) },
        { metric: t("garden.detail.falsePositives"), value: "0" },
        { metric: t("garden.detail.falseNegatives"), value: "0" },
        { metric: t("garden.detail.latencyP50"), value: card.eval.latency },
      ]
    : [];

  const tabs = [
    { key: "overview", label: t("garden.detail.overview") },
    ...(card.eval ? [{ key: "eval", label: t("garden.detail.evalResults") }] : []),
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Back link */}
      <div
        onClick={onBack}
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-3" />
        <span>{t(card.nameKey)}</span>
      </div>

      {/* ── Header block (Vertex-style) ── */}
      <div className="mb-2 flex items-center gap-4">
        <Logo src={card.logo} label={t(card.nameKey)} className="w-10 h-10 rounded-lg object-contain shrink-0" />
        <h1 className="m-0 text-[28px] font-normal leading-tight text-foreground">{t(card.nameKey)}</h1>
      </div>

      <p className="m-0 mb-5 text-sm leading-relaxed text-muted-foreground">{t(card.descriptionKey)}</p>

      {/* Action buttons — outlined style like Vertex */}
      <div className="mb-8 flex gap-2.5">
        <Button variant="outline" className="rounded-full" onClick={() => setIsAddFormVisible(true)}>
          {t("garden.detail.createGuardrail")}
        </Button>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className="mb-7 border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px cursor-pointer border-b-[3px] px-5 py-3 text-sm",
                activeTab === tab.key
                  ? "border-info font-medium text-info"
                  : "border-transparent font-normal text-muted-foreground",
              )}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="flex gap-16">
          {/* Left column — overview + details table */}
          <div className="min-w-0 flex-1">
            <h2 className="m-0 mb-3 text-lg font-normal text-foreground">{t("garden.detail.overview")}</h2>
            <p className="m-0 mb-8 text-sm leading-[1.7] text-foreground">{t(card.descriptionKey)}</p>

            <h2 className="m-0 mb-1 text-lg font-normal text-foreground">{t("garden.detail.guardrailDetails")}</h2>
            <p className="m-0 mb-4 text-[13px] text-muted-foreground">{t("garden.detail.detailsAsFollows")}</p>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-50 py-3 text-left font-medium text-muted-foreground">
                    {t("garden.detail.property")}
                  </th>
                  <th className="py-3 text-left font-medium text-muted-foreground">{t(card.nameKey)}</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 text-foreground">{row.property}</td>
                    <td className="py-3 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column — metadata sidebar like Vertex */}
          <div className="w-60 shrink-0">
            {/* Guardrail ID */}
            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">{t("garden.detail.guardrailId")}</div>
              <div className="break-all text-[13px] text-foreground">litellm/{card.id}</div>
            </div>

            {/* Type */}
            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">{t("garden.detail.type")}</div>
              <div className="text-[13px] text-foreground">
                {card.category === "litellm" ? t("garden.detail.contentFilter") : t("garden.detail.partner")}
              </div>
            </div>

            {/* Tags — pill style like Vertex */}
            {card.tagKeys.length > 0 && (
              <div className="mb-7">
                <div className="mb-2 text-xs text-muted-foreground">{t("garden.detail.tags")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {card.tagKeys.map((tagKey) => (
                    <span
                      key={tagKey}
                      className="rounded-2xl border border-border bg-card px-3 py-1 text-xs text-foreground"
                    >
                      {t(tagKey)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "eval" && (
        <div>
          <h2 className="m-0 mb-4 text-lg font-normal text-foreground">{t("garden.detail.evalResults")}</h2>
          <table className="w-full max-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("garden.detail.metric")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("garden.detail.value")}</th>
              </tr>
            </thead>
            <tbody>
              {evalRows.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3 text-foreground">{row.metric}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGuardrailForm
        visible={isAddFormVisible}
        onClose={() => setIsAddFormVisible(false)}
        accessToken={accessToken}
        onSuccess={() => {
          setIsAddFormVisible(false);
          onGuardrailCreated();
        }}
        preset={GUARDRAIL_PRESETS[card.id]}
      />
    </div>
  );
};

export default GuardrailDetailView;
