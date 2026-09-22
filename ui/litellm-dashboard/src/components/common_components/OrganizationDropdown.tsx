import React from "react";
import { useTranslation } from "react-i18next";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Organization } from "../networking";

interface OrganizationDropdownProps {
  organizations?: Organization[] | null;
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  placeholder?: string;
  id?: string;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  organizations,
  value,
  onChange,
  disabled,
  loading,
  style,
  placeholder,
  id,
}) => {
  const { t } = useTranslation("common");
  return (
    <div style={{ minWidth: 280, ...style }}>
      <SearchSelect
        options={(organizations ?? []).map((org) => ({
          label: org.organization_alias || org.organization_id,
          value: org.organization_id,
          sublabel: org.organization_id,
        }))}
        value={value}
        onValueChange={(organizationId) => onChange?.(organizationId)}
        placeholder={placeholder ?? t("select.allOrganizations")}
        emptyText={loading ? t("select.loadingOrganizations") : t("select.noOrganizations")}
        disabled={disabled}
        inputId={id}
      />
    </div>
  );
};

export default OrganizationDropdown;
