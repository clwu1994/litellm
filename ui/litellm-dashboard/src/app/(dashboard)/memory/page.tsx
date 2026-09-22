"use client";

import { MemoryView } from "./_components/MemoryView";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { AdminOnlyNotice } from "@/components/shared/AdminOnlyNotice";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useCan from "@/app/(dashboard)/hooks/useCan";
import { useTranslation } from "react-i18next";

export default function Memory() {
  const { t } = useTranslation("memory");
  const { accessToken, userRole, userId } = useAuthorized();
  const canViewMemory = useCan("viewMemory");

  if (!canViewMemory) {
    return <AdminOnlyNotice pageTitle={t("page.title")} />;
  }

  return (
    <>
      <DeprecationBanner featureName="Memory" />
      <MemoryView accessToken={accessToken} userID={userId} userRole={userRole} />
    </>
  );
}
