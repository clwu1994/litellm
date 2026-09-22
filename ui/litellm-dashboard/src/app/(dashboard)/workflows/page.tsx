"use client";

import { useTranslation } from "react-i18next";

import WorkflowRuns from "./WorkflowRuns";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { AdminOnlyNotice } from "@/components/shared/AdminOnlyNotice";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useCan from "@/app/(dashboard)/hooks/useCan";

export default function Workflows() {
  const { t } = useTranslation("workflows");
  const { accessToken } = useAuthorized();
  const canViewWorkflowRuns = useCan("viewWorkflowRuns");

  if (!canViewWorkflowRuns) {
    return <AdminOnlyNotice pageTitle={t("page.title")} />;
  }

  return (
    <>
      <DeprecationBanner featureName="Workflows" />
      <WorkflowRuns accessToken={accessToken} />
    </>
  );
}
