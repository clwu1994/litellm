"use client";

import { useMemo, useState } from "react";
import { FolderPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { toast } from "@/lib/toast";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Button } from "@/components/ui/button";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useCreateProject, ProjectCreateParams } from "@/app/(dashboard)/hooks/projects/useCreateProject";
import { ProjectBaseForm } from "./ProjectBaseForm";
import { emptyProjectFormValues, projectFormSchema } from "./projectFormSchema";
import { buildProjectCreateParams } from "./projectFormUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateProjectForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("projects");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const form = useZodForm(
    useMemo(() => projectFormSchema(t), [t]),
    { defaultValues: emptyProjectFormValues },
  );
  const createMutation = useCreateProject();

  const handleSubmit = form.handleSubmit((values) => {
    const params: ProjectCreateParams = {
      ...buildProjectCreateParams(values),
      team_id: values.team_id,
    };

    createMutation.mutate(params, {
      onSuccess: () => {
        toast.success(t("toasts.created"));
        form.reset(emptyProjectFormValues);
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || t("toasts.createFailed"));
      },
    });
  });

  const handleCancel = () => {
    form.reset(emptyProjectFormValues);
    onClose();
  };

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <ProjectBaseForm form={form} advancedOpen={advancedOpen} onAdvancedOpenChange={setAdvancedOpen} />

      <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {t("modals.cancel")}
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={createMutation.isPending}>
          {createMutation.isPending ? <UiLoadingSpinner /> : <FolderPlus />}
          {t("modals.createSubmit")}
        </Button>
      </div>
    </form>
  );
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { t } = useTranslation("projects");
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("modals.createTitle")}</DialogTitle>
        </DialogHeader>
        <CreateProjectForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
