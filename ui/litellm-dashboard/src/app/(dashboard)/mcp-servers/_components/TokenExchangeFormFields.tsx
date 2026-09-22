import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useWatch } from "react-hook-form";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { selectControl, selectTriggerControl, tagsControl, textControl } from "./mcpFieldRules";

interface TokenExchangeFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const TokenExchangeFormFields: React.FC<TokenExchangeFormFieldsProps> = ({ isEditing = false }) => {
  const { t } = useTranslation("mcpServers");
  const profileItems = [
    { value: "rfc8693", label: t("form.tokenExchange.profileOptions.rfc8693") },
    { value: "entra_obo", label: t("form.tokenExchange.profileOptions.entraObo") },
  ];
  const clientIdPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientIdEdit")
    : t("form.credentials.enterOAuthClientId");
  const clientSecretPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientSecretEdit")
    : t("form.credentials.enterOAuthClientSecret");
  const isEntraObo = useWatch({ name: "token_exchange_profile" }) === "entra_obo";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel label={t("form.tokenExchange.profileLabel")} tooltip={t("form.tokenExchange.profileTooltip")} />
        }
        name="token_exchange_profile"
        {...(isEditing ? {} : { defaultValue: "rfc8693" })}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={profileItems}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profileItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="font-medium">{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel label={t("form.tokenExchange.endpointLabel")} tooltip={t("form.tokenExchange.endpointTooltip")} />
        }
        name="token_exchange_endpoint"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://idp.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.credentials.clientId")} tooltip={t("form.tokenExchange.clientIdTooltip")} />}
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating(t("form.tokenExchange.clientIdRequired"))}
      >
        {(control) => (
          <PasswordInput {...textControl(control)} placeholder={clientIdPlaceholder} groupClassName={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("form.credentials.clientSecret")}
            tooltip={t("form.tokenExchange.clientSecretTooltip")}
          />
        }
        name={["credentials", "client_secret"]}
        required={!isEditing}
        rules={requiredWhenCreating(t("form.tokenExchange.clientSecretRequired"))}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={clientSecretPlaceholder}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      {!isEntraObo && (
        <>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.credentials.audienceOptional")}
                tooltip={t("form.tokenExchange.audienceTooltip")}
              />
            }
            name="audience"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.credentials.subjectTokenTypeOptional")}
                tooltip={t("form.tokenExchange.subjectTokenTypeTooltip")}
              />
            }
            name="subject_token_type"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="urn:ietf:params:oauth:token-type:access_token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
        </>
      )}
      <MountedFormField
        label={
          <FieldLabel
            label={isEntraObo ? t("form.tokenExchange.scopesLabel") : t("form.credentials.scopesOptional")}
            tooltip={isEntraObo ? t("form.tokenExchange.scopesTooltipEntraObo") : t("form.tokenExchange.scopesTooltip")}
          />
        }
        name={["credentials", "scopes"]}
        required={isEntraObo}
        rules={
          isEntraObo
            ? {
                validate: {
                  required: requiredRule(t("form.tokenExchange.scopesRequired")),
                },
              }
            : undefined
        }
      >
        {(control) => (
          <MultiSelect
            {...tagsControl(control, t)}
            placeholder={isEntraObo ? "api://<app-id>/.default" : t("form.credentials.addScopes")}
            className="rounded-lg"
          />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default TokenExchangeFormFields;
