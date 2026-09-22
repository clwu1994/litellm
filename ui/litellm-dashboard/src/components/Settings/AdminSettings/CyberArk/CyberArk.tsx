"use client";

import type { ParseKeys } from "i18next";
import { Edit, ExternalLink, Info, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { testCyberArkConnection } from "@/app/(dashboard)/hooks/configOverrides/cyberArkApi";
import { useCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig";
import { useDeleteCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkConfig";
import { useUpdateCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import CyberArkEmptyPlaceholder from "./CyberArkEmptyPlaceholder";
import EditCyberArkModal from "./EditCyberArkModal";
import { FIELD_LABEL_KEYS, SENSITIVE_FIELDS } from "./constants";

function detectAuthMethodKey(values: Record<string, unknown>): ParseKeys<"settings"> {
  if (values.cyberark_api_key) return "cyberark.authMethods.apiKey";
  if (values.client_cert && values.client_key) return "cyberark.authMethods.tlsCertificate";
  return "cyberark.authMethods.none";
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

export default function CyberArk() {
  const { t } = useTranslation("settings");
  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useCyberArkConfig();
  const { mutate: deleteConfig, isPending: isDeleting } = useDeleteCyberArkConfig(accessToken);
  const { mutate: updateConfig, isPending: isClearingField } = useUpdateCyberArkConfig(accessToken);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clearingField, setClearingField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const rawValues = data?.values ?? {};
  const isConfigured = Boolean(rawValues.cyberark_api_base);

  const fieldLabel = (fieldName: string) => {
    const key = FIELD_LABEL_KEYS[fieldName];
    return key ? t(key) : fieldName;
  };

  const handleTestConnection = async () => {
    if (!accessToken) return;
    setIsTesting(true);
    try {
      const result = await testCyberArkConnection(accessToken);
      toast.success(result.message || t("cyberark.connectionSuccess"));
    } catch (err) {
      toast.fromError(err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    deleteConfig(undefined, {
      onSuccess: () => {
        toast.success(t("cyberark.deletedSuccess"));
        setIsDeleteModalOpen(false);
      },
      onError: (err) => toast.fromError(err),
    });
  };

  const handleClearField = () => {
    if (!clearingField) return;
    updateConfig(
      { [clearingField]: "" },
      {
        onSuccess: () => {
          toast.success(t("shared.clearedField", { field: fieldLabel(clearingField) }));
          setClearingField(null);
        },
        onError: (err) => toast.fromError(err),
      },
    );
  };

  const renderValue = (key: string) => {
    const value = rawValues[key];
    if (!value) return <span className="text-muted-foreground italic">{t("shared.notConfigured")}</span>;
    if (!SENSITIVE_FIELDS.has(key)) return <span className="font-mono text-muted-foreground">{value}</span>;

    return (
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-muted-foreground">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("shared.clearFieldAria", { field: fieldLabel(key) })}
          onClick={() => setClearingField(key)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    );
  };

  const fieldsToShow = Object.entries(rawValues).filter(([, value]) => value != null && value !== "");

  const renderCard = () => {
    if (isLoading) {
      return (
        <Card role="status" aria-label={t("cyberark.loadingAria")}>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      );
    }
    if (isError) {
      return (
        <Card>
          <CardContent>
            <Alert variant="error">
              <AlertTitle>{t("cyberark.loadError")}</AlertTitle>
              {error instanceof Error && <AlertDescription>{error.message}</AlertDescription>}
            </Alert>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyRound className="size-6 text-muted-foreground" />
            <div>
              <CardTitle>
                <h3>{t("cyberark.title")}</h3>
              </CardTitle>
              <CardDescription>{t("shared.manageSecretManager")}</CardDescription>
            </div>
          </div>
          {isConfigured && (
            <CardAction className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={isTesting} onClick={handleTestConnection}>
                <PlugZap />
                {isTesting ? t("shared.testing") : t("shared.testConnection")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditModalVisible(true)}>
                <Edit />
                {t("shared.editConfiguration")}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 />
                {t("shared.deleteConfiguration")}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isConfigured && (
            <Alert variant="info">
              <Info />
              <AlertTitle>{t("cyberark.hotReload")}</AlertTitle>
              <AlertDescription>
                <a
                  href="https://docs.litellm.ai/docs/secret_managers/cyberark"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  {t("shared.viewDocumentation")}
                  <ExternalLink className="size-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          {isConfigured ? (
            fieldsToShow.length > 0 && (
              <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                <DetailRow label={t("shared.authMethod")}>{t(detectAuthMethodKey(rawValues))}</DetailRow>
                {fieldsToShow.map(([key]) => (
                  <DetailRow key={key} label={fieldLabel(key)}>
                    {renderValue(key)}
                  </DetailRow>
                ))}
              </dl>
            )
          ) : (
            <CyberArkEmptyPlaceholder onAdd={() => setIsEditModalVisible(true)} />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderCard()}

      <EditCyberArkModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => setIsEditModalVisible(false)}
      />
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t("cyberark.deleteTitle")}
        message={t("cyberark.deleteMessage")}
        resourceInformationTitle={t("cyberark.deleteResourceTitle")}
        resourceInformation={[{ label: t("cyberark.fields.cyberark_api_base"), value: rawValues.cyberark_api_base }]}
        onCancel={() => setIsDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={isDeleting}
      />
      <DeleteResourceModal
        isOpen={clearingField !== null}
        title={t("shared.clearTitle", { field: clearingField ? fieldLabel(clearingField) : "" })}
        message={t("shared.clearMessage")}
        resourceInformationTitle={t("shared.field")}
        resourceInformation={[{ label: t("shared.field"), value: clearingField ? fieldLabel(clearingField) : "" }]}
        onCancel={() => setClearingField(null)}
        onOk={handleClearField}
        confirmLoading={isClearingField}
      />
    </>
  );
}
