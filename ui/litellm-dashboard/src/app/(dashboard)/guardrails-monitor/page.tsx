"use client";

import GuardrailsMonitorView from "./_components/GuardrailsMonitorView";
import { AdminOnlyNotice } from "@/components/shared/AdminOnlyNotice";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useCan from "@/app/(dashboard)/hooks/useCan";
import { useTranslation } from "react-i18next";

export default function GuardrailsMonitor() {
  const { t } = useTranslation("guardrailsMonitor");
  const { accessToken } = useAuthorized();
  const canViewGuardrailUsage = useCan("viewGuardrailUsage");

  if (!canViewGuardrailUsage) {
    return <AdminOnlyNotice pageTitle={t("title")} />;
  }

  return <GuardrailsMonitorView accessToken={accessToken} />;
}
