import { Info, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ValidationMessage } from "../common_components/formRules";
import TierRowSelect from "./TierRowSelect";
import {
  type TierRow,
  MAX_TIER_COUNT,
  MAX_TIER_DEFINITION_CHARS,
  MAX_TIER_NAME_CHARS,
  MIN_TIER_COUNT,
  activeTierName,
  isBuiltInTierName,
} from "./tier_rows";

export const rowOrigin = (row: TierRow, isCustomSet: boolean): string => {
  if (!isCustomSet) return row.id;
  return isBuiltInTierName(row.name)
    ? "autoRouterConfig.complexity.tierRow.originBuiltIn"
    : "autoRouterConfig.complexity.tierRow.originCustom";
};

export const TierSetToolbar: React.FC<{
  editing: boolean;
  isCustomSet: boolean;
  rowCount: number;
  rowsError: ValidationMessage | null;
  keywordRulesError: ValidationMessage | null | undefined;
  onEditingChange: ((editing: boolean) => void) | undefined;
  onAdd: () => void;
  onRestore: () => void;
}> = ({ editing, isCustomSet, rowCount, rowsError, keywordRulesError, onEditingChange, onAdd, onRestore }) => {
  const { t } = useTranslation("models");
  const rowsErrorText = rowsError ? t(rowsError.key, rowsError.values) : undefined;
  const keywordRulesErrorText = keywordRulesError ? t(keywordRulesError.key, keywordRulesError.values) : undefined;
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button variant="outline" onClick={onAdd} disabled={rowCount >= MAX_TIER_COUNT}>
              <Plus />
              {t("autoRouterConfig.complexity.toolbar.addTier")}
            </Button>
            <SimpleTooltip content={rowsErrorText}>
              <Button variant="outline" disabled={Boolean(rowsError)} onClick={() => onEditingChange?.(false)}>
                {t("autoRouterConfig.complexity.toolbar.done")}
              </Button>
            </SimpleTooltip>
            {isCustomSet && (
              <Button variant="outline" size="sm" onClick={onRestore}>
                {t("autoRouterConfig.complexity.toolbar.restoreDefaults")}
              </Button>
            )}
          </>
        ) : (
          onEditingChange && (
            <Button variant="outline" onClick={() => onEditingChange(true)}>
              {t("autoRouterConfig.complexity.toolbar.editTiers")}
            </Button>
          )
        )}
      </div>
      {editing && (
        <span className="block mt-1 text-xs text-muted-foreground">
          {t("autoRouterConfig.complexity.toolbar.editHint")}
        </span>
      )}
      {editing && keywordRulesErrorText && (
        <span className="block mt-1 text-xs text-destructive">
          {keywordRulesErrorText}. {t("autoRouterConfig.complexity.toolbar.keywordErrorSuffix")}
        </span>
      )}
    </>
  );
};

export const FallbackTierField: React.FC<{
  rows: readonly TierRow[];
  fallbackTierId: string;
  onValueChange: (rowId: string) => void;
}> = ({ rows, fallbackTierId, onValueChange }) => {
  const { t } = useTranslation("models");
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <strong className="text-base font-semibold">{t("autoRouterConfig.complexity.fallback.heading")}</strong>
        <SimpleTooltip content={t("autoRouterConfig.complexity.fallback.tooltip")}>
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <TierRowSelect
        label={t("autoRouterConfig.complexity.fallback.label")}
        options={rows
          .filter((row) => activeTierName(row))
          .map((row) => ({ value: row.id, label: activeTierName(row) }))}
        value={fallbackTierId || null}
        onValueChange={onValueChange}
        placeholder={t("autoRouterConfig.complexity.fallback.placeholder")}
      />
    </div>
  );
};

export const TierRowHeader: React.FC<{
  row: TierRow;
  index: number;
  rowCount: number;
  label: string;
  description: string | undefined;
  editing: boolean;
  isCustomSet: boolean;
  onRemove: () => void;
}> = ({ row, index, rowCount, label, description, editing, isCustomSet, onRemove }) => {
  const { t } = useTranslation("models");
  const origin = rowOrigin(row, isCustomSet);
  const originText = isCustomSet ? t(origin as ParseKeys<"models">) : origin;
  return (
    <div className="flex items-center gap-2 mb-2">
      <strong className="text-base font-semibold">{t("autoRouterConfig.complexity.tierRow.title", { label })}</strong>
      <SimpleTooltip
        content={row.definition.trim() || description || t("autoRouterConfig.complexity.tierRow.customTooltip")}
      >
        <Info className="size-4 text-muted-foreground" />
      </SimpleTooltip>
      <span className="text-xs text-muted-foreground">
        {t("autoRouterConfig.complexity.tierRow.position", { index: index + 1, count: rowCount })} &middot; {originText}
      </span>
      {editing && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive/80"
          aria-label={t("autoRouterConfig.complexity.tierRow.removeAria", {
            label: activeTierName(row) || t("autoRouterConfig.complexity.tierRow.unnamedLabel", { index: index + 1 }),
          })}
          disabled={rowCount <= MIN_TIER_COUNT}
          onClick={onRemove}
        >
          <Trash2 />
          {t("autoRouterConfig.complexity.tierRow.remove")}
        </Button>
      )}
    </div>
  );
};

export const TierRowEditFields: React.FC<{
  row: TierRow;
  index: number;
  definitionMissing: boolean;
  onPatch: (patch: Partial<Omit<TierRow, "id">>) => void;
}> = ({ row, index, definitionMissing, onPatch }) => {
  const { t } = useTranslation("models");
  return (
    <>
      <Input
        value={row.name}
        onChange={(event) => onPatch({ name: event.target.value })}
        placeholder={t("autoRouterConfig.complexity.tierRow.namePlaceholder")}
        aria-label={t("autoRouterConfig.complexity.tierRow.nameAria", { index: index + 1 })}
        maxLength={MAX_TIER_NAME_CHARS}
        className="mb-2"
      />
      <Textarea
        value={row.definition}
        onChange={(event) => onPatch({ definition: event.target.value.replace(/[\r\n]+/g, " ") })}
        placeholder={
          isBuiltInTierName(row.name)
            ? t("autoRouterConfig.complexity.tierRow.definitionBuiltInPlaceholder")
            : t("autoRouterConfig.complexity.tierRow.definitionCustomPlaceholder")
        }
        aria-label={t("autoRouterConfig.complexity.tierRow.definitionAria", { index: index + 1 })}
        maxLength={MAX_TIER_DEFINITION_CHARS}
        rows={2}
        className={definitionMissing ? "mb-2 border-destructive" : "mb-2"}
      />
      {definitionMissing && (
        <span className="mb-2 block text-xs text-destructive">
          {t("autoRouterConfig.complexity.tierRow.definitionRequired")}
        </span>
      )}
    </>
  );
};
