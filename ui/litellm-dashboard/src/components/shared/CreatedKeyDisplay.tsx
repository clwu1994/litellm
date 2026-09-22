import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

interface CreatedKeyDisplayProps {
  apiKey: string;
}

/**
 * Shared component for displaying a newly-created virtual key.
 * Used on the Virtual Keys page and in the Add Agent wizard.
 */
const CreatedKeyDisplay: React.FC<CreatedKeyDisplayProps> = ({ apiKey }) => {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    toast.success(t("createdKeyDisplay.copiedToast"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="mb-2">
        <Trans i18nKey="createdKeyDisplay.saveWarning" components={{ bold: <b /> }} />
      </p>

      <p className="text-sm text-muted-foreground mt-3 mb-1">{t("createdKeyDisplay.virtualKey")}</p>
      <div className="bg-muted rounded-md p-2.5 mb-2.5">
        <pre className="m-0 whitespace-normal break-words text-foreground">{apiKey}</pre>
      </div>

      <CopyToClipboard text={apiKey} onCopy={handleCopy}>
        <Button className="mt-3">{copied ? t("createdKeyDisplay.copied") : t("createdKeyDisplay.copy")}</Button>
      </CopyToClipboard>
    </div>
  );
};

export default CreatedKeyDisplay;
