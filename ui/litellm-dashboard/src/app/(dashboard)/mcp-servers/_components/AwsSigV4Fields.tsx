import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { requiredWhenSiblingSet, textControl } from "./mcpFieldRules";

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const ACCESS_KEY_PATH = ["credentials", "aws_access_key_id"] as const;
const SECRET_KEY_PATH = ["credentials", "aws_secret_access_key"] as const;

const AwsSigV4Fields: React.FC = () => {
  const { t } = useTranslation("mcpServers");
  return (
    <>
      <p className="text-sm text-muted-foreground mb-2">
        {t("form.aws.heading")}{" "}
        <a
          href="https://docs.litellm.ai/docs/mcp_aws_sigv4"
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80"
        >
          {t("form.aws.docsLink")}
        </a>
      </p>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.region.label")} tooltip={t("form.aws.region.tooltip")} />}
        name={["credentials", "aws_region_name"]}
        required
        rules={{ validate: { required: requiredRule(t("form.aws.region.required")) } }}
      >
        {(control) => <Input {...textControl(control)} placeholder="us-east-1" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.serviceName.label")} tooltip={t("form.aws.serviceName.tooltip")} />}
        name={["credentials", "aws_service_name"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="bedrock-agentcore" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.accessKeyId.label")} tooltip={t("form.aws.accessKeyId.tooltip")} />}
        name={ACCESS_KEY_PATH}
        rules={{
          deps: ["credentials.aws_secret_access_key"],
          validate: {
            pairedWithSecret: requiredWhenSiblingSet(SECRET_KEY_PATH, t("form.aws.accessKeyId.pairedWithSecret")),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("form.aws.accessKeyId.placeholder")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel label={t("form.aws.secretAccessKey.label")} tooltip={t("form.aws.secretAccessKey.tooltip")} />
        }
        name={SECRET_KEY_PATH}
        rules={{
          deps: ["credentials.aws_access_key_id"],
          validate: {
            pairedWithAccessKey: requiredWhenSiblingSet(
              ACCESS_KEY_PATH,
              t("form.aws.secretAccessKey.pairedWithAccessKey"),
            ),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("form.aws.secretAccessKey.placeholder")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.sessionToken.label")} tooltip={t("form.aws.sessionToken.tooltip")} />}
        name={["credentials", "aws_session_token"]}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("form.aws.sessionToken.placeholder")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.roleArn.label")} tooltip={t("form.aws.roleArn.tooltipCreate")} />}
        name={["credentials", "aws_role_name"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={t("form.aws.roleArn.placeholder")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={t("form.aws.sessionName.label")} tooltip={t("form.aws.sessionName.tooltip")} />}
        name={["credentials", "aws_session_name"]}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder={t("form.aws.sessionName.placeholder")}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
    </>
  );
};

export default AwsSigV4Fields;
