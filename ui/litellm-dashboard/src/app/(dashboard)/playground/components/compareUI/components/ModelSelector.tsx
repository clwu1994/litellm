import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Input } from "@/components/ui/input";
interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  models: string[];
  loading?: boolean;
  disabled?: boolean;
}
export function ModelSelector({ value, onChange, models, loading, disabled }: ModelSelectorProps) {
  const { t } = useTranslation("playground");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const options = useMemo(() => Array.from(new Set(models)).sort(), [models]);
  const displayOptions = useMemo(() => {
    if (value && !options.includes(value)) {
      return [value, ...options];
    }
    return options;
  }, [options, value]);

  const selectValue = isAddingCustom ? "__custom__" : value || undefined;

  const handleSelectChange = (selected: string | null) => {
    if (selected === null) return;
    if (selected === "__custom__") {
      setIsAddingCustom(true);
      if (value && !options.includes(value)) {
        setCustomValue(value);
      } else {
        setCustomValue("");
      }
      return;
    }
    setIsAddingCustom(false);
    setCustomValue("");
    onChange(selected);
  };

  const commitCustomValue = () => {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setIsAddingCustom(false);
      setCustomValue("");
      return;
    }
    onChange(trimmed);
    setIsAddingCustom(false);
    setCustomValue("");
  };
  return (
    <div className="flex-1 min-w-0">
      <SearchSelect
        options={[
          ...displayOptions.map((model) => ({ label: model, value: model })),
          { label: t("compare.selector.addCustomModel"), value: "__custom__" },
        ]}
        value={selectValue ?? ""}
        onValueChange={handleSelectChange}
        disabled={disabled}
        placeholder={loading ? t("compare.selector.loadingModels") : t("compare.selector.modelPlaceholder")}
        emptyText={t("compare.selector.noModelsFound")}
        allowClear={false}
        className="rounded-md"
      />
      {isAddingCustom && (
        <Input
          className="mt-2"
          placeholder={t("compare.selector.customModelNamePlaceholder")}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitCustomValue();
            }
          }}
          onBlur={commitCustomValue}
          autoFocus
        />
      )}
    </div>
  );
}
