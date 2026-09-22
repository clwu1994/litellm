import type { TFunction } from "i18next";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, FileDown } from "lucide-react";
import { z } from "zod/v4";
import { getGlobalLitellmHeaderName } from "@/components/networking";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const buildCloudZeroSettingsSchema = (t: TFunction<"costTracking">) =>
  z.object({
    api_key: z.string().min(1, t("cloudzero.apiKeyRequired")),
    connection_id: z.string().min(1, t("cloudzero.connectionIdRequiredAlt")),
  });

interface CloudZeroExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
}

type CloudZeroSettings = z.output<ReturnType<typeof buildCloudZeroSettingsSchema>>;

interface CloudZeroSettingsView {
  api_key_masked: string;
  connection_id: string;
  status: string;
}

type ExportType = "cloudzero" | "csv";

const CloudZeroExportModal: React.FC<CloudZeroExportModalProps> = ({ isOpen, onClose, accessToken }) => {
  const { t } = useTranslation("costTracking");
  const schema = useMemo(() => buildCloudZeroSettingsSchema(t), [t]);
  const form = useZodForm(schema, {
    defaultValues: { api_key: "", connection_id: "" },
  });
  const [loading, setLoading] = useState(false);
  const [existingSettings, setExistingSettings] = useState<CloudZeroSettingsView | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("cloudzero");
  const [exportLoading, setExportLoading] = useState(false);

  const loadExistingSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/cloudzero/settings", {
        method: "GET",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const settings = await response.json();
        setExistingSettings(settings);
        // Pre-populate form with existing settings (except masked API key)
        form.setValue("connection_id", settings.connection_id);
      } else if (response.status !== 404) {
        // 404 means no settings configured yet, which is fine
        const errorData = await response.json();
        toast.fromError(t("cloudzero.loadSettingsFailed", { error: errorData.error || t("cloudzero.unknownError") }));
      }
    } catch (error) {
      console.error("Error loading CloudZero settings:", error);
      toast.fromError(t("cloudzero.loadSettingsFailedPlain"));
    } finally {
      setSettingsLoading(false);
    }
  }, [accessToken, form, t]);

  useEffect(() => {
    if (isOpen && accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the loading flag is part of the fetch this effect starts
      void loadExistingSettings();
    }
  }, [isOpen, accessToken, loadExistingSettings]);

  const handleSaveCloudZeroSettings = async (values: CloudZeroSettings) => {
    if (!accessToken) {
      toast.fromError(t("cloudzero.noAccessToken"));
      return;
    }

    setLoading(true);
    try {
      const endpoint = existingSettings ? "/cloudzero/settings" : "/cloudzero/init";
      const method = existingSettings ? "PUT" : "POST";

      // Add default timezone for backend compatibility
      const payload = {
        ...values,
        timezone: "UTC",
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || t("cloudzero.saveSuccess"));
        setExistingSettings({
          api_key_masked: values.api_key.substring(0, 4) + "****" + values.api_key.slice(-4),
          connection_id: values.connection_id,
          status: "configured",
        });
        return true;
      } else {
        toast.fromError(data.error || t("cloudzero.saveFailed"));
        return false;
      }
    } catch (error) {
      console.error("Error saving CloudZero settings:", error);
      toast.fromError(t("cloudzero.saveFailed"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleExportCloudZero = async () => {
    if (!accessToken) {
      toast.fromError(t("cloudzero.noAccessToken"));
      return;
    }

    setExportLoading(true);
    try {
      const response = await fetch("/cloudzero/export", {
        method: "POST",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 100000,
          operation: "replace_hourly",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || t("cloudzero.exportCompleted"));
        onClose();
      } else {
        toast.fromError(data.error || t("cloudzero.exportToCloudZeroFailed"));
      }
    } catch (error) {
      console.error("Error exporting to CloudZero:", error);
      toast.fromError(t("cloudzero.exportToCloudZeroFailed"));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // TODO: Implement CSV export functionality
      toast.info(t("cloudzero.csvComingSoon"));
      onClose();
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.fromError(t("cloudzero.csvFailed"));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = async () => {
    if (exportType === "cloudzero") {
      // Check if settings exist, if not save them first
      if (!existingSettings) {
        let values: CloudZeroSettings | undefined;
        await form.handleSubmit((formValues) => {
          values = formValues;
        })();
        if (!values) return;
        const success = await handleSaveCloudZeroSettings(values);
        if (!success) return;
      }
      await handleExportCloudZero();
    } else {
      await handleExportCSV();
    }
  };

  const handleModalClose = () => {
    form.reset();
    setExportType("cloudzero");
    setExistingSettings(null);
    onClose();
  };

  const exportOptions = [
    {
      value: "cloudzero",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/cloudzero.png"
            alt="CloudZero"
            className="w-5 h-5"
            onError={(e) => {
              // Fallback to text if image fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>{t("cloudzero.exportToCloudZero")}</span>
        </div>
      ),
    },
    {
      value: "csv",
      label: (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{t("cloudzero.exportToCsv")}</span>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("cloudzero.exportDataTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Export Type Selection */}
          <div>
            <p className="text-sm font-medium mb-2 block">{t("cloudzero.exportDestination")}</p>
            <Select items={exportOptions} value={exportType} onValueChange={(value) => value && setExportType(value)}>
              <SelectTrigger className="w-full" aria-label={t("cloudzero.exportDestination")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CloudZero Configuration */}
          {exportType === "cloudzero" && (
            <div>
              {settingsLoading ? (
                <div className="flex justify-center py-8">
                  <UiLoadingSpinner className="size-8" />
                </div>
              ) : (
                <>
                  {existingSettings && (
                    <Alert className="mb-4">
                      <CircleCheck />
                      <AlertTitle>{t("cloudzero.existingConfig")}</AlertTitle>
                      <AlertDescription>
                        {t("cloudzero.apiKeyMasked", { key: existingSettings.api_key_masked })}
                        <br />
                        {t("cloudzero.connectionIdInline", { id: existingSettings.connection_id })}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!existingSettings && (
                    <form onSubmit={(event) => event.preventDefault()}>
                      <FieldGroup>
                        <FormField control={form.control} name="api_key" label={t("cloudzero.apiKeyLabel")}>
                          {({ ref, ...field }) => (
                            <PasswordInput {...field} ref={ref} placeholder={t("cloudzero.apiKeyPlaceholder")} />
                          )}
                        </FormField>

                        <FormField control={form.control} name="connection_id" label={t("cloudzero.connectionIdLabel")}>
                          {({ ref, ...field }) => (
                            <Input {...field} ref={ref} placeholder={t("cloudzero.connectionIdPlaceholder")} />
                          )}
                        </FormField>
                      </FieldGroup>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* CSV Export Info */}
          {exportType === "csv" && (
            <Alert variant="info">
              <FileDown />
              <AlertTitle>{t("cloudzero.csvTitle")}</AlertTitle>
              <AlertDescription>{t("cloudzero.csvDescription")}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleModalClose}>
              {t("cloudzero.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={loading || exportLoading}
              aria-busy={loading || exportLoading}
            >
              {(loading || exportLoading) && <UiLoadingSpinner className="size-4" />}
              {exportType === "cloudzero" ? t("cloudzero.exportToCloudZero") : t("cloudzero.exportCsv")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloudZeroExportModal;
