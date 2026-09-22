import { Play } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAvailableModels, type ModelGroup } from "@/components/llm_calls/fetch_models";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_SCHEMA = `{
  "verdict": "correct" | "false_positive" | "false_negative",
  "confidence": 0.0,
  "justification": "string",
  "risk_category": "string",
  "suggested_action": "keep" | "adjust threshold" | "add allowlist"
}
`;

export interface EvaluationSettingsModalProps {
  open: boolean;
  onClose: () => void;
  guardrailName?: string;
  accessToken: string | null;
  onRunEvaluation?: (settings: { prompt: string; schema: string; model: string }) => void;
}

export function EvaluationSettingsModal({
  open,
  onClose,
  guardrailName,
  accessToken,
  onRunEvaluation,
}: EvaluationSettingsModalProps) {
  const { t } = useTranslation("guardrailsMonitor");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [model, setModel] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelGroup[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const defaultPrompt = t("evaluation.defaultPrompt");

  useEffect(() => {
    if (!open || !accessToken) {
      setModelOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingModels(true);
    fetchAvailableModels(accessToken)
      .then((list) => {
        if (!cancelled) setModelOptions(list);
      })
      .catch(() => {
        if (!cancelled) setModelOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

  const handleResetPrompt = () => setPrompt(null);
  const handleRun = () => {
    if (model) {
      onRunEvaluation?.({ prompt: prompt ?? defaultPrompt, schema, model });
      onClose();
    }
  };

  const modelSelectOptions = useMemo(
    () => modelOptions.map((m) => ({ value: m.model_group, label: m.model_group })),
    [modelOptions],
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t("evaluation.title")}</DialogTitle>
          <DialogDescription>
            {guardrailName
              ? t("evaluation.descriptionNamed", { name: guardrailName })
              : t("evaluation.descriptionGeneric")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="evaluation-prompt" className="text-sm font-medium text-foreground">
                {t("evaluation.promptLabel")}
              </label>
              <Button variant="link" size="xs" onClick={handleResetPrompt}>
                {t("evaluation.resetToDefault")}
              </Button>
            </div>
            <Textarea
              id="evaluation-prompt"
              value={prompt ?? defaultPrompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="field-sizing-fixed font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t("evaluation.promptHint")}</p>
          </div>

          <div>
            <label htmlFor="evaluation-schema" className="mb-1.5 block text-sm font-medium text-foreground">
              {t("evaluation.schemaLabel")}
            </label>
            <p className="mb-1 text-xs text-muted-foreground">{t("evaluation.schemaHint")}</p>
            <Textarea
              id="evaluation-schema"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={6}
              className="field-sizing-fixed font-mono text-sm"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">{t("evaluation.modelLabel")}</p>
            <SearchSelect
              options={modelSelectOptions}
              value={model ?? undefined}
              onValueChange={(value) => setModel(value || null)}
              placeholder={loadingModels ? t("evaluation.loadingModels") : t("evaluation.selectModel")}
              emptyText={!accessToken ? t("evaluation.signInToSeeModels") : t("evaluation.noModels")}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("evaluation.cancel")}
          </Button>
          <Button onClick={handleRun} disabled={!model}>
            <Play className="size-4" />
            {t("evaluation.runEvaluation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
