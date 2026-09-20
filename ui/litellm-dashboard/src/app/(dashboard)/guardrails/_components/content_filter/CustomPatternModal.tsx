import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actionItems } from "./action_options";

interface CustomPatternModalProps {
  visible: boolean;
  patternName: string;
  patternRegex: string;
  patternAction: "BLOCK" | "MASK";
  onNameChange: (name: string) => void;
  onRegexChange: (regex: string) => void;
  onActionChange: (action: "BLOCK" | "MASK") => void;
  onAdd: () => void;
  onCancel: () => void;
}

const CustomPatternModal: React.FC<CustomPatternModalProps> = ({
  visible,
  patternName,
  patternRegex,
  patternAction,
  onNameChange,
  onRegexChange,
  onActionChange,
  onAdd,
  onCancel,
}) => {
  const { t } = useTranslation("guardrails");
  const items = useMemo(() => actionItems(t), [t]);

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t("contentFilter.customPatternModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="font-semibold">{t("contentFilter.customPatternModal.patternName")}</p>
            <Input
              className="mt-2"
              placeholder="e.g., internal_id, employee_code"
              value={patternName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div>
            <p className="font-semibold">{t("contentFilter.customPatternModal.regexPattern")}</p>
            <Input
              className="mt-2"
              placeholder="e.g., ID-[0-9]{6}"
              value={patternRegex}
              onChange={(e) => onRegexChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("contentFilter.customPatternModal.regexHint")}</p>
          </div>

          <div>
            <p className="font-semibold">{t("contentFilter.customPatternModal.action")}</p>
            <p className="mt-1 mb-2 text-muted-foreground">{t("contentFilter.customPatternModal.actionHint")}</p>
            <Select
              items={items}
              value={patternAction}
              onValueChange={(value: string | null) => value && onActionChange(value as "BLOCK" | "MASK")}
            >
              <SelectTrigger className="w-full" aria-label={t("contentFilter.customPatternModal.action")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("contentFilter.customPatternModal.cancel")}
          </Button>
          <Button onClick={onAdd}>{t("contentFilter.customPatternModal.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPatternModal;
