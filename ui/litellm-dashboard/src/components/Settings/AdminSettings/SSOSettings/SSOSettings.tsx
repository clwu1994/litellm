"use client";

import type { ParseKeys } from "i18next";
import { Copy, Edit, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSSOSettings, type SSOSettingsValues } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import { Logo } from "@/components/molecules/logo/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/utils/dataUtils";

import AddSSOSettingsModal from "./Modals/AddSSOSettingsModal";
import DeleteSSOSettingsModal from "./Modals/DeleteSSOSettingsModal";
import EditSSOSettingsModal from "./Modals/EditSSOSettingsModal";
import RedactableField from "./RedactableField";
import RoleMappings from "./RoleMappings";
import SSOSettingsEmptyPlaceholder from "./SSOSettingsEmptyPlaceholder";
import SSOSettingsLoadingSkeleton from "./SSOSettingsLoadingSkeleton";
import { ssoProviderDisplayNameKeys, ssoProviderLogoMap } from "./constants";
import { detectSSOProvider } from "./utils";

interface SSODetailField {
  labelKey: ParseKeys<"settings">;
  render: (values: SSOSettingsValues) => React.ReactNode;
}

interface SSODetailConfig {
  providerText: string;
  fields: ReadonlyArray<SSODetailField | null>;
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

function EndpointValue({ value }: { value?: string | null }) {
  const { t } = useTranslation("settings");

  if (!value) return <span className="font-mono text-muted-foreground">-</span>;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate font-mono text-sm text-muted-foreground">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("sso.copyValue")}
        onClick={() => void copyToClipboard(value, t("sso.copiedToClipboard"))}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

export default function SSOSettings() {
  const { t } = useTranslation("settings");
  const { data: ssoSettings, refetch, isLoading } = useSSOSettings();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isSSOConfigured = [
    ssoSettings?.values.google_client_id,
    ssoSettings?.values.microsoft_client_id,
    ssoSettings?.values.generic_client_id,
    ssoSettings?.values.saml_idp_metadata_url,
    ssoSettings?.values.saml_idp_metadata_xml,
  ].some(Boolean);
  const selectedProvider = ssoSettings?.values ? detectSSOProvider(ssoSettings.values) : null;
  const isRoleMappingsEnabled = Boolean(ssoSettings?.values.role_mappings);
  const isTeamMappingsEnabled = Boolean(ssoSettings?.values.team_mappings);

  const notConfigured = <span className="text-muted-foreground italic">{t("shared.notConfigured")}</span>;
  const renderSimpleValue = (value?: string | null) => value || notConfigured;
  const renderTeamMappingsField = (values: SSOSettingsValues) =>
    values.team_mappings?.team_ids_jwt_field ? (
      <Badge variant="secondary">{values.team_mappings.team_ids_jwt_field}</Badge>
    ) : (
      notConfigured
    );

  const providerConfigs: Record<string, SSODetailConfig> = {
    google: {
      providerText: t(ssoProviderDisplayNameKeys.google),
      fields: [
        {
          labelKey: "sso.fields.clientId",
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_id} />,
        },
        {
          labelKey: "sso.fields.clientSecret",
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_secret} />,
        },
        {
          labelKey: "sso.fields.proxyBaseUrl",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    microsoft: {
      providerText: t(ssoProviderDisplayNameKeys.microsoft),
      fields: [
        {
          labelKey: "sso.fields.clientId",
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_id} />,
        },
        {
          labelKey: "sso.fields.clientSecret",
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_secret} />,
        },
        {
          labelKey: "sso.fields.tenant",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.microsoft_tenant),
        },
        {
          labelKey: "sso.fields.proxyBaseUrl",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    okta: {
      providerText: t(ssoProviderDisplayNameKeys.okta),
      fields: [
        {
          labelKey: "sso.fields.clientId",
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          labelKey: "sso.fields.clientSecret",
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          labelKey: "sso.fields.authorizationEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          labelKey: "sso.fields.tokenEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          labelKey: "sso.fields.userInfoEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          labelKey: "sso.fields.scopes",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          labelKey: "sso.fields.proxyBaseUrl",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              labelKey: "sso.fields.teamIdsJwtField",
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    generic: {
      providerText: t(ssoProviderDisplayNameKeys.generic),
      fields: [
        {
          labelKey: "sso.fields.clientId",
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          labelKey: "sso.fields.clientSecret",
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          labelKey: "sso.fields.authorizationEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          labelKey: "sso.fields.tokenEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          labelKey: "sso.fields.userInfoEndpoint",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          labelKey: "sso.fields.scopes",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          labelKey: "sso.fields.proxyBaseUrl",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              labelKey: "sso.fields.teamIdsJwtField",
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    saml: {
      providerText: t(ssoProviderDisplayNameKeys.saml),
      fields: [
        {
          labelKey: "sso.fields.idpMetadataUrl",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_idp_metadata_url} />,
        },
        {
          labelKey: "sso.fields.idpMetadataXml",
          render: (values: SSOSettingsValues) =>
            values.saml_idp_metadata_xml ? <Badge variant="secondary">{t("sso.provided")}</Badge> : notConfigured,
        },
        {
          labelKey: "sso.fields.spEntityId",
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_sp_entity_id} />,
        },
        {
          labelKey: "sso.fields.allowIdpInitiated",
          render: (values: SSOSettingsValues) => (
            <Badge variant={values.saml_allow_unsolicited === "true" ? "default" : "secondary"}>
              {values.saml_allow_unsolicited === "true" ? t("sso.enabled") : t("sso.disabled")}
            </Badge>
          ),
        },
        {
          labelKey: "sso.fields.proxyBaseUrl",
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
  };

  const renderSSOSettings = () => {
    if (!ssoSettings?.values || !selectedProvider) return null;
    const config = providerConfigs[selectedProvider];
    if (!config) return null;

    return (
      <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
        <DetailRow label={t("sso.provider")}>
          <div className="flex items-center gap-2">
            {ssoProviderLogoMap[selectedProvider] && (
              <Logo
                src={ssoProviderLogoMap[selectedProvider]}
                label={t(ssoProviderDisplayNameKeys[selectedProvider] ?? "sso.providers.generic")}
                className="size-6 object-contain"
              />
            )}
            <span>{config.providerText}</span>
          </div>
        </DetailRow>
        {config.fields.map(
          (field) =>
            field && (
              <DetailRow key={field.labelKey} label={t(field.labelKey)}>
                {field.render(ssoSettings.values)}
              </DetailRow>
            ),
        )}
      </dl>
    );
  };

  return (
    <>
      {isLoading ? (
        <SSOSettingsLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-muted-foreground" />
                <div>
                  <CardTitle>
                    <h3>{t("sso.title")}</h3>
                  </CardTitle>
                  <CardDescription>{t("sso.description")}</CardDescription>
                </div>
              </div>
              {isSSOConfigured && (
                <CardAction className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalVisible(true)}>
                    <Edit />
                    {t("sso.editSettings")}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setIsDeleteModalVisible(true)}>
                    <Trash2 />
                    {t("sso.deleteSettings")}
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {isSSOConfigured ? (
                renderSSOSettings()
              ) : (
                <SSOSettingsEmptyPlaceholder onAdd={() => setIsAddModalVisible(true)} />
              )}
            </CardContent>
          </Card>
          {isRoleMappingsEnabled && <RoleMappings roleMappings={ssoSettings?.values.role_mappings} />}
        </div>
      )}

      <DeleteSSOSettingsModal
        isVisible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onSuccess={() => refetch()}
      />
      <AddSSOSettingsModal
        isVisible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          refetch();
        }}
      />
      <EditSSOSettingsModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false);
          refetch();
        }}
      />
    </>
  );
}
