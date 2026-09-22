import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requiredUnlessSiblingSet, tagsControl, textControl } from "./mcpFieldRules";

interface IdJagFormFieldsProps {
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

const PRIVATE_KEY_PATH = ["credentials", "client_private_key"] as const;

const IdJagFormFields: React.FC<IdJagFormFieldsProps> = ({ isEditing = false }) => {
  const { t } = useTranslation("mcpServers");
  const clientIdPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientIdEdit")
    : t("form.credentials.enterOAuthClientId");
  const clientSecretPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientSecretEdit")
    : t("form.credentials.enterOAuthClientSecret");
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel label={t("form.idJag.orgTokenEndpointLabel")} tooltip={t("form.idJag.orgTokenEndpointTooltip")} />
        }
        name="token_exchange_endpoint"
        required={!isEditing}
        rules={requiredWhenCreating(t("form.idJag.orgTokenEndpointRequired"))}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://your-org.okta.com/oauth2/v1/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("form.idJag.resourceTokenEndpointLabel")}
            tooltip={t("form.idJag.resourceTokenEndpointTooltip")}
          />
        }
        name={["credentials", "id_jag_resource_token_endpoint"]}
        required={!isEditing}
        rules={requiredWhenCreating(t("form.idJag.resourceTokenEndpointRequired"))}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://upstream.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.credentials.clientId")} tooltip={t("form.idJag.clientIdTooltip")} />}
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating(t("form.idJag.clientIdRequired"))}
      >
        {(control) => (
          <PasswordInput {...textControl(control)} placeholder={clientIdPlaceholder} groupClassName={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.credentials.clientSecret")} tooltip={t("form.idJag.clientSecretTooltip")} />}
        name={["credentials", "client_secret"]}
        rules={
          isEditing
            ? undefined
            : {
                deps: ["credentials.client_private_key"],
                validate: {
                  secretOrPrivateKey: requiredUnlessSiblingSet(PRIVATE_KEY_PATH, t("form.idJag.secretOrPrivateKey")),
                },
              }
        }
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={clientSecretPlaceholder}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.idJag.privateKeyLabel")} tooltip={t("form.idJag.privateKeyTooltip")} />}
        name={PRIVATE_KEY_PATH}
      >
        {(control) => (
          <Textarea
            {...textControl(control)}
            rows={3}
            placeholder={isEditing ? t("form.idJag.privateKeyPlaceholderEdit") : t("form.idJag.privateKeyPlaceholder")}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.idJag.privateKeyIdLabel")} tooltip={t("form.idJag.privateKeyIdTooltip")} />}
        name={["credentials", "client_private_key_id"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="my-signing-key-1" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.idJag.signingAlgLabel")} tooltip={t("form.idJag.signingAlgTooltip")} />}
        name={["credentials", "client_assertion_signing_alg"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="RS256" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.credentials.audienceOptional")} tooltip={t("form.idJag.audienceTooltip")} />}
        name="audience"
      >
        {(control) => (
          <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("form.credentials.resourceIndicatorOptional")}
            tooltip={t("form.idJag.resourceIndicatorTooltip")}
          />
        }
        name={["credentials", "id_jag_resource"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder="https://upstream.example.com/mcp" className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("form.credentials.subjectTokenTypeOptional")}
            tooltip={t("form.idJag.subjectTokenTypeTooltip")}
          />
        }
        name="subject_token_type"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="urn:ietf:params:oauth:token-type:id_token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.credentials.scopesOptional")} tooltip={t("form.idJag.scopesTooltip")} />}
        name={["credentials", "scopes"]}
      >
        {(control) => (
          <MultiSelect
            {...tagsControl(control, t)}
            placeholder={t("form.credentials.addScopes")}
            className="rounded-lg"
          />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default IdJagFormFields;
