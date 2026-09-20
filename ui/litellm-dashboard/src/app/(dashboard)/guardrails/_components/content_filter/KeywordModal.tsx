import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { actionItems } from "./action_options";

interface KeywordModalProps {
  visible: boolean;
  keyword: string;
  action: "BLOCK" | "MASK";
  description: string;
  onKeywordChange: (keyword: string) => void;
  onActionChange: (action: "BLOCK" | "MASK") => void;
  onDescriptionChange: (description: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

const KeywordModal: React.FC<KeywordModalProps> = ({
  visible,
  keyword,
  action,
  description,
  onKeywordChange,
  onActionChange,
  onDescriptionChange,
  onAdd,
  onCancel,
}) => {
  const { t } = useTranslation("guardrails");
  const items = useMemo(() => actionItems(t), [t]);

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t("contentFilter.keywordModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="font-semibold">{t("contentFilter.keywordModal.keyword")}</p>
            <Input
              className="mt-2"
              placeholder={t("contentFilter.keywordModal.keywordPlaceholder")}
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
            />
          </div>

          <div>
            <p className="font-semibold">{t("contentFilter.keywordModal.action")}</p>
            <p className="mt-1 mb-2 text-muted-foreground">{t("contentFilter.keywordModal.actionHint")}</p>
            <Select
              items={items}
              value={action}
              onValueChange={(value: string | null) => value && onActionChange(value as "BLOCK" | "MASK")}
            >
              <SelectTrigger className="w-full" aria-label={t("contentFilter.keywordModal.action")}>
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

          <div>
            <p className="font-semibold">{t("contentFilter.keywordModal.description")}</p>
            <Textarea
              className="mt-2 field-sizing-fixed"
              placeholder={t("contentFilter.keywordModal.descriptionPlaceholder")}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("contentFilter.keywordModal.cancel")}
          </Button>
          <Button onClick={onAdd}>{t("contentFilter.keywordModal.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KeywordModal;
