import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { selectControl, selectTriggerControl } from "./mcpFieldRules";

interface TokenEndpointAuthMethodFieldProps {
  isEditing?: boolean;
}

const TokenEndpointAuthMethodField: React.FC<TokenEndpointAuthMethodFieldProps> = ({ isEditing = false }) => {
  const { t } = useTranslation("mcpServers");
  const options = [
    { value: "client_secret_basic", label: t("form.tokenEndpointAuthMethod.options.basic") },
    { value: "client_secret_post", label: t("form.tokenEndpointAuthMethod.options.post") },
  ];
  const placeholder = isEditing
    ? t("form.tokenEndpointAuthMethod.placeholderEdit")
    : t("form.tokenEndpointAuthMethod.placeholder");
  return (
    <MountedFormField
      label={
        <span className="text-sm font-medium text-foreground flex items-center">
          {t("form.tokenEndpointAuthMethod.label")}
          <SimpleTooltip content={t("form.tokenEndpointAuthMethod.tooltip")}>
            <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
          </SimpleTooltip>
        </span>
      }
      name={["credentials", "token_endpoint_auth_method"]}
    >
      {(control) => (
        <Select {...selectControl<string>(control)} items={options}>
          <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>{placeholder}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </MountedFormField>
  );
};

export default TokenEndpointAuthMethodField;
