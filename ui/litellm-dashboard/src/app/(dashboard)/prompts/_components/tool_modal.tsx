import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ToolModalProps {
  visible: boolean;
  initialJson: string;
  onSave: (json: string) => void;
  onClose: () => void;
}

const defaultToolJson = `{
  "type": "function",
  "function": {
    "name": "get_current_weather",
    "description": "Get the current weather in a given location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state, e.g. San Francisco, CA"
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"]
        }
      },
      "required": ["location"]
    }
  }
}`;

const ToolModal: React.FC<ToolModalProps> = ({ visible, initialJson, onSave, onClose }) => {
  const { t } = useTranslation("prompts");
  const [json, setJson] = useState(initialJson || defaultToolJson);
  const [hasError, setHasError] = useState(false);

  const handleSave = () => {
    try {
      JSON.parse(json);
      setHasError(false);
      onSave(json);
    } catch (e) {
      setHasError(true);
    }
  };

  const handleClose = () => {
    setHasError(false);
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("tools.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {hasError && (
            <div
              role="alert"
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm"
            >
              {t("tools.invalidJson")}
            </div>
          )}
          <textarea
            aria-label={t("tools.jsonAria")}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="w-full min-h-[400px] px-4 py-3 border border-input rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
            placeholder={t("tools.jsonPlaceholder")}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("tools.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("tools.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolModal;
