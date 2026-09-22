import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deletePolicyAttachmentCall } from "@/components/networking";
import { toast } from "@/lib/toast";

interface UseDeletePolicyAttachmentProps {
  accessToken: string | null;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useDeletePolicyAttachment = ({ accessToken, onSuccess, onError }: UseDeletePolicyAttachmentProps) => {
  const { t } = useTranslation("policies");
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      if (!accessToken) {
        throw new Error("Access token is required");
      }
      return deletePolicyAttachmentCall(accessToken, attachmentId);
    },
    onSuccess: () => {
      toast.success(t("attachments.toast.deleted"));
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error deleting attachment:", error);
      toast.error(t("attachments.toast.deleteFailed"));
      if (onError) {
        onError(error);
      }
    },
  });
};
