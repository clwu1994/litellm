import React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DEFAULT_PROMPT_NAME } from "./utils";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  const { t } = useTranslation("prompts");
  const displayName = promptName === DEFAULT_PROMPT_NAME ? t("editor.defaultPromptName") : promptName;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("publish.title")}</DialogTitle>
          <DialogDescription>{t("publish.description")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="publish-prompt-name" className="mb-2 block">
            {t("publish.name")}
          </label>
          <Input
            id="publish-prompt-name"
            value={displayName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t("publish.namePlaceholder")}
            onKeyDown={(event) => event.key === "Enter" && onPublish()}
            autoFocus
          />
          <p className="text-muted-foreground text-xs mt-2">{t("publish.hint")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("form.cancel")}
          </Button>
          <Button onClick={onPublish} disabled={isSaving}>
            {isSaving && <LoaderCircleIcon className="animate-spin" />}
            {t("publish.publish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishModal;
