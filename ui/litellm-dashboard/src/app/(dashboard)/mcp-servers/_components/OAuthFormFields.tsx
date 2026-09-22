import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OAUTH_FLOW } from "@/components/mcp_tools/types";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import TokenEndpointAuthMethodField from "./TokenEndpointAuthMethodField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import {
  numberControl,
  parsesAsJson,
  selectControl,
  selectTriggerControl,
  tagsControl,
  textControl,
} from "./mcpFieldRules";

interface OAuthFlowStatus {
  startOAuthFlow: () => void;
  status: string;
  error: string | null;
  tokenResponse: { access_token?: string; expires_in?: number } | null;
}

interface OAuthFormFieldsProps {
  isM2M: boolean;
  isEditing?: boolean;
  oauthFlow?: OAuthFlowStatus;
  initialFlowType?: string;
  /** Link to provider docs for creating an OAuth app (e.g. GitHub). */
  docsUrl?: string | null;
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

const UpstreamResourceField: React.FC = () => {
  const { t } = useTranslation("mcpServers");
  return (
    <MountedFormField
      label={
        <FieldLabel
          label={t("form.credentials.resourceIndicatorOptional")}
          tooltip={t("form.oauth.resourceIndicatorTooltip")}
        />
      }
      name={["credentials", "upstream_resource"]}
    >
      {(control) => (
        <Input
          {...textControl(control)}
          placeholder={t("form.oauth.upstreamResourcePlaceholder")}
          className={fieldClassName}
        />
      )}
    </MountedFormField>
  );
};

const OAuthFormFields: React.FC<OAuthFormFieldsProps> = ({
  isM2M,
  isEditing = false,
  oauthFlow,
  initialFlowType,
  docsUrl,
}) => {
  const { t } = useTranslation("mcpServers");
  const flowItems = [
    { value: OAUTH_FLOW.M2M, label: t("form.oauth.flowOptions.m2m") },
    { value: OAUTH_FLOW.INTERACTIVE, label: t("form.oauth.flowOptions.interactive") },
  ];
  const m2mClientIdPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientIdEdit")
    : t("form.credentials.enterOAuthClientId");
  const m2mClientSecretPlaceholder = isEditing
    ? t("form.credentials.enterOAuthClientSecretEdit")
    : t("form.credentials.enterOAuthClientSecret");
  const clientIdPlaceholder = isEditing ? t("form.credentials.enterClientIdEdit") : t("form.credentials.enterClientId");
  const clientSecretPlaceholder = isEditing
    ? t("form.credentials.enterClientSecretEdit")
    : t("form.credentials.enterClientSecret");
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={<FieldLabel label={t("form.oauth.flowTypeLabel")} tooltip={t("form.oauth.flowTypeTooltip")} />}
        name="oauth_flow_type"
        {...(initialFlowType ? { defaultValue: initialFlowType } : {})}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={flowItems}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue placeholder={t("form.oauth.flowPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OAUTH_FLOW.M2M}>
                <div>
                  <span className="font-medium">{t("form.oauth.flowOptions.m2m")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t("form.oauth.m2mDescription")}</span>
                </div>
              </SelectItem>
              <SelectItem value={OAUTH_FLOW.INTERACTIVE}>
                <div>
                  <span className="font-medium">{t("form.oauth.flowOptions.interactive")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t("form.oauth.interactiveDescription")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </MountedFormField>

      {isM2M ? (
        <>
          <MountedFormField
            label={<FieldLabel label={t("form.credentials.clientId")} tooltip={t("form.oauth.m2mClientIdTooltip")} />}
            name={["credentials", "client_id"]}
            required={!isEditing}
            rules={requiredWhenCreating(t("form.oauth.m2mClientIdRequired"))}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={m2mClientIdPlaceholder}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel label={t("form.credentials.clientSecret")} tooltip={t("form.oauth.m2mClientSecretTooltip")} />
            }
            name={["credentials", "client_secret"]}
            required={!isEditing}
            rules={requiredWhenCreating(t("form.oauth.m2mClientSecretRequired"))}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={m2mClientSecretPlaceholder}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={t("form.credentials.tokenUrl")} tooltip={t("form.oauth.m2mTokenUrlTooltip")} />}
            name="token_url"
            required={!isEditing}
            rules={requiredWhenCreating(t("form.oauth.m2mTokenUrlRequired"))}
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://auth.example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel label={t("form.credentials.scopesOptional")} tooltip={t("form.oauth.m2mScopesTooltip")} />
            }
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
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
        </>
      ) : (
        <>
          <MountedFormField
            label={
              <span className="flex items-center justify-between w-full">
                <FieldLabel
                  label={t("form.credentials.clientIdOptional")}
                  tooltip={t("form.oauth.interactiveClientIdTooltip")}
                />
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:text-info/80 ml-2 font-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("form.oauth.createOAuthApp")}
                  </a>
                )}
              </span>
            }
            name={["credentials", "client_id"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={clientIdPlaceholder}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.credentials.clientSecretOptional")}
                tooltip={t("form.oauth.interactiveClientIdTooltip")}
              />
            }
            name={["credentials", "client_secret"]}
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
            label={
              <FieldLabel
                label={t("form.credentials.scopesOptional")}
                tooltip={t("form.oauth.interactiveScopesTooltip")}
              />
            }
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
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
          <MountedFormField
            label={<FieldLabel label={t("form.oauth.issuerLabel")} tooltip={t("form.oauth.issuerTooltip")} />}
            name="issuer"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://issuer.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.oauth.authorizationUrlLabel")}
                tooltip={t("form.oauth.authorizationUrlTooltip")}
              />
            }
            name="authorization_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/authorize"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={t("form.oauth.tokenUrlLabel")} tooltip={t("form.oauth.tokenUrlTooltip")} />}
            name="token_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.oauth.registrationUrlLabel")}
                tooltip={t("form.oauth.registrationUrlTooltip")}
              />
            }
            name="registration_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/register"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.oauth.tokenValidationLabel")}
                tooltip={t("form.oauth.tokenValidationTooltip")}
              />
            }
            name="token_validation_json"
            rules={{ validate: { json: parsesAsJson(t("form.oauth.tokenValidationInvalidJson")) } }}
          >
            {(control) => (
              <Textarea
                {...textControl(control)}
                placeholder={'{\n  "organization": "my-org",\n  "team.id": "123"\n}'}
                rows={4}
                className="font-mono text-sm rounded-lg border-border focus:border-info focus:ring-ring"
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("form.oauth.tokenStorageTtlLabel")}
                tooltip={t("form.oauth.tokenStorageTtlTooltip")}
              />
            }
            name="token_storage_ttl_seconds"
          >
            {(control) => (
              <Input
                {...numberControl(control)}
                min={1}
                placeholder={t("form.oauth.tokenStorageTtlPlaceholder")}
                className="w-full rounded-lg"
              />
            )}
          </MountedFormField>
          {oauthFlow && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">{t("form.oauth.authorizeIntro")}</p>
              <Button
                variant="secondary"
                onClick={oauthFlow.startOAuthFlow}
                disabled={oauthFlow.status === "authorizing" || oauthFlow.status === "exchanging"}
              >
                {oauthFlow.status === "authorizing"
                  ? t("form.oauth.waitingForAuthorization")
                  : oauthFlow.status === "exchanging"
                    ? t("form.oauth.exchangingCode")
                    : t("form.oauth.authorizeAndFetchToken")}
              </Button>
              {oauthFlow.error && <p className="text-sm text-destructive">{oauthFlow.error}</p>}
              {oauthFlow.status === "success" && oauthFlow.tokenResponse?.access_token && (
                <p className="text-sm text-success">
                  {t("form.oauth.tokenFetched", { seconds: oauthFlow.tokenResponse.expires_in ?? "?" })}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default OAuthFormFields;
