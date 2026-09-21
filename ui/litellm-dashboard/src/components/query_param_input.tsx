import React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyValuePair } from "./key_value_input";

interface QueryParamInputProps {
  value?: readonly KeyValuePair[];
  onChange?: (value: readonly KeyValuePair[]) => void;
}

const QueryParamInput: React.FC<QueryParamInputProps> = ({ value = [], onChange }) => {
  const { t } = useTranslation("models");

  const handleAdd = () => onChange?.([...value, ["", ""]]);

  const handleRemove = (index: number) => onChange?.(value.filter((_, i) => i !== index));

  const handleChange = (index: number, pair: KeyValuePair) =>
    onChange?.(value.map((existing, i) => (i === index ? pair : existing)));

  return (
    <div className="space-y-2">
      {value.map(([key, val], index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={t("passThrough.queryParams.namePlaceholder")}
            value={key}
            onChange={(e) => handleChange(index, [e.target.value, val])}
          />
          <Input
            placeholder={t("passThrough.queryParams.valuePlaceholder")}
            value={val}
            onChange={(e) => handleChange(index, [key, e.target.value])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(index)}
            aria-label={t("passThrough.queryParams.removeAria", { index: index + 1 })}
          >
            <Minus />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus />
        {t("passThrough.queryParams.addButton")}
      </Button>
    </div>
  );
};

export default QueryParamInput;
