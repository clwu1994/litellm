import { SearchSelect } from "@/components/shared/SearchSelect";
import React from "react";
import { useTranslation } from "react-i18next";
import { ENDPOINT_OPTIONS } from "./chatConstants";

interface EndpointSelectorProps {
  endpointType: string | null;
  onEndpointChange: (value: string | null) => void;
  className?: string;
}

const EndpointSelector: React.FC<EndpointSelectorProps> = ({ endpointType, onEndpointChange, className }) => {
  const { t } = useTranslation("playground");
  return (
    <div className={className}>
      <SearchSelect
        value={endpointType}
        onValueChange={onEndpointChange}
        options={ENDPOINT_OPTIONS}
        placeholder={t("chat.config.selectEndpoint")}
      />
    </div>
  );
};

export default EndpointSelector;
