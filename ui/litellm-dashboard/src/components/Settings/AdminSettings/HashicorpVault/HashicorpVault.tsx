"use client";

import type { ParseKeys } from "i18next";
import { Edit, ExternalLink, Info, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { testHashicorpVaultConnection } from "@/app/(dashboard)/hooks/configOverrides/hashicorpVaultApi";
import { useDeleteHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteHashicorpVaultConfig";
import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import EditHashicorpVaultModal from "./EditHashicorpVaultModal";
import HashicorpVaultEmptyPlaceholder from "./HashicorpVaultEmptyPlaceholder";
import { FIELD_LABEL_KEYS, SENSITIVE_FIELDS } from "./constants";

function detectAuthMethodKey(values: Record<string, unknown>): ParseKeys<"settings"> {
  if (values.approle_role_id || values.approle_secret_id) return "vault.authMethods.approle";
  if (values.client_cert && values.client_key) return "vault.authMethods.tlsCertificate";
  if (values.vault_token) return "vault.authMethods.token";
  return "vault.authMethods.none";
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

export default function HashicorpVault() {
  const { t } = useTranslation("settings");
  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useHashicorpVaultConfig();
  const { mutate: deleteConfig, isPending: isDeleting } = useDeleteHashicorpVaultConfig(accessToken);
  const { mutate: updateConfig, isPending: isClearingField } = useUpdateHashicorpVaultConfig(accessToken);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clearingField, setClearingField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const rawValues = data?.values ?? {};
  const isConfigured = Boolean(rawValues.vault_addr);

  const fieldLabel = (fieldName: string) => {
    const key = FIELD_LABEL_KEYS[fieldName];
    return key ? t(key) : fieldName;
  };

  const handleTestConnection = async () => {
    if (!accessToken) return;
    setIsTesting(true);
    try {
      const result = await testHashicorpVaultConnection(accessToken);
      toast.success(result.message || t("vault.connectionSuccess"));
    } catch (err) {
      toast.fromError(err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    deleteConfig(undefined, {
      onSuccess: () => {
        toast.success(t("vault.deletedSuccess"));
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

  return (
    <>
      {isLoading ? (
        <Card role="status" aria-label={t("vault.loadingAria")}>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent>
            <Alert variant="error">
              <AlertTitle>{t("vault.loadError")}</AlertTitle>
              {error instanceof Error && <AlertDescription>{error.message}</AlertDescription>}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <KeyRound className="size-6 text-muted-foreground" />
              <div>
                <CardTitle>
                  <h3>{t("vault.title")}</h3>
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
                <AlertTitle>{t("vault.keyFieldTitle")}</AlertTitle>
                <AlertDescription>
                  <code className="block font-mono">vault kv put secret/SECRET_NAME key=secret_value</code>
                  <a
                    href="https://docs.litellm.ai/docs/secret_managers/hashicorp_vault"
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
              <HashicorpVaultEmptyPlaceholder onAdd={() => setIsEditModalVisible(true)} />
            )}
          </CardContent>
        </Card>
      )}

      <EditHashicorpVaultModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => setIsEditModalVisible(false)}
      />
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t("vault.deleteTitle")}
        message={t("vault.deleteMessage")}
        resourceInformationTitle={t("vault.deleteResourceTitle")}
        resourceInformation={[{ label: t("vault.fields.vault_addr"), value: rawValues.vault_addr }]}
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
