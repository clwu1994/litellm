import React from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { AUTH_TYPE } from "@/components/mcp_tools/types";

/**
 * Warning shown in the create/edit MCP server forms when auth_type
 * true_passthrough is selected: the gateway performs no admission auth for
 * that server, so callers reach the upstream without a LiteLLM identity.
 */
export default function TruePassthroughWarning({ authType }: { authType?: string | null }) {
  const { t } = useTranslation("mcpServers");
  if (authType !== AUTH_TYPE.TRUE_PASSTHROUGH) return null;
  return (
    <Alert className="mb-4">
      <TriangleAlert />
      <AlertTitle>{t("form.truePassthrough.title")}</AlertTitle>
      <AlertDescription>{t("form.truePassthrough.description")}</AlertDescription>
    </Alert>
  );
}
