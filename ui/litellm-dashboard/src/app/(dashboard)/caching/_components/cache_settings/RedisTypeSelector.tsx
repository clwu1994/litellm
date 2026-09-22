import React from "react";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedisTypeSelectorProps {
  redisType: string;
  redisTypeDescriptions: Readonly<Record<string, ParseKeys<"caching">>>;
  onTypeChange: (type: string) => void;
}

const REDIS_TYPE_LABEL_KEYS: Readonly<Record<string, ParseKeys<"caching">>> = {
  node: "redisType.node",
  cluster: "redisType.cluster",
  sentinel: "redisType.sentinel",
  semantic: "redisType.semantic",
};

const RedisTypeSelector: React.FC<RedisTypeSelectorProps> = ({ redisType, redisTypeDescriptions, onTypeChange }) => {
  const { t } = useTranslation("caching");
  const labelKey = REDIS_TYPE_LABEL_KEYS[redisType];
  const descriptionKey = redisTypeDescriptions[redisType] ?? "redisType.fallbackDescription";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("redisType.label")}</label>
      <Select value={redisType} onValueChange={(value) => value !== null && onTypeChange(value)}>
        <SelectTrigger className="w-full">
          <SelectValue>{labelKey === undefined ? redisType : t(labelKey)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REDIS_TYPE_LABEL_KEYS).map(([value, key]) => (
            <SelectItem key={value} value={value}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t(descriptionKey)}</p>
    </div>
  );
};

export default RedisTypeSelector;
