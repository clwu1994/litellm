import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface ResetFiltersButtonProps {
  onClick: () => void;
  label?: string;
}

export const ResetFiltersButton: React.FC<ResetFiltersButtonProps> = ({ onClick, label }) => {
  const { t } = useTranslation("common");

  return (
    <Button variant="outline" onClick={onClick}>
      <RotateCcw className="size-4" />
      {label ?? t("filters.reset")}
    </Button>
  );
};
