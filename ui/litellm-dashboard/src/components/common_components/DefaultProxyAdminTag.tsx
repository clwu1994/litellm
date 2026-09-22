import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { DEFAULT_PROXY_ADMIN_USER_ID } from "@/utils/sentinels";

interface DefaultProxyAdminTagProps {
  userId: string | null | undefined;
}

export default function DefaultProxyAdminTag({ userId }: DefaultProxyAdminTagProps) {
  const { t } = useTranslation("common");
  if (userId === DEFAULT_PROXY_ADMIN_USER_ID) {
    return <Badge variant="secondary">{t("defaultProxyAdminTag.label")}</Badge>;
  }

  return <span>{userId}</span>;
}
