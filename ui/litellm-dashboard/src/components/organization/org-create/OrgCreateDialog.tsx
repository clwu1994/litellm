"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { organizationKeys } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { BUDGET_DURATION_OPTIONS, NO_RESET } from "../org-settings/OrgSettingsForm";
import { buildOrgSettingsSchema } from "../org-settings/schema";
import { buildOrgCreateBody, emptyOrgFormValues, type OrgCreateBody } from "./mapper";

const defaultCreateOrganization = async (body: OrgCreateBody): Promise<unknown> => {
  const { data } = await fetchClient.POST("/organization/new", { body });
  return data;
};

interface OrgCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  createOrganization?: (body: OrgCreateBody) => Promise<unknown>;
}

export const OrgCreateDialog = ({
  open,
  onOpenChange,
  accessToken,
  createOrganization = defaultCreateOrganization,
}: OrgCreateDialogProps) => {
  const { t } = useTranslation("organizations");
  const queryClient = useQueryClient();
  const schema = React.useMemo(() => buildOrgSettingsSchema(t), [t]);
  const form = useZodForm(schema, { defaultValues: emptyOrgFormValues });
  const budgetDurationOptions = React.useMemo(
    () => BUDGET_DURATION_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t],
  );

  const closeAndReset = () => {
    form.reset(emptyOrgFormValues);
    onOpenChange(false);
  };

  const mutation = useMutation({
    mutationFn: (body: OrgCreateBody) => createOrganization(body),
    onSuccess: () => {
      toast.success(t("toast.created"));
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      closeAndReset();
    },
    onError: (error: unknown) => toast.fromError(error instanceof Error ? error.message : t("toast.createFailed")),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset(emptyOrgFormValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (mutation.isPending) return;
    mutation.mutate(buildOrgCreateBody(values));
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField control={form.control} name="organization_alias" label={t("table.header.organizationName")}>
              {({ ref, ...field }) => <Input {...field} ref={ref} />}
            </FormField>

            <FormField control={form.control} name="models" label={t("table.header.models")}>
              {(field) => (
                <ModelSelect
                  value={field.value}
                  onChange={field.onChange}
                  context="organization"
                  options={{ includeSpecialOptions: true, showAllProxyModelsOverride: true }}
                />
              )}
            </FormField>

            <FormField control={form.control} name="max_budget" label={t("field.maxBudget")}>
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
            </FormField>

            <FormField control={form.control} name="budget_duration" label={t("field.resetBudget")}>
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Select
                  items={budgetDurationOptions}
                  value={value === "" ? NO_RESET : value}
                  onValueChange={(selected) => onChange(selected === NO_RESET ? "" : selected)}
                >
                  <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetDurationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField control={form.control} name="tpm_limit" label={t("field.tpmLimit")}>
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
            </FormField>

            <FormField control={form.control} name="rpm_limit" label={t("field.rpmLimit")}>
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
            </FormField>

            <FormField
              control={form.control}
              name="vector_stores"
              label={t("create.allowedVectorStores")}
              description={t("create.allowedVectorStoresDescription")}
            >
              {(field) => (
                <VectorStoreSelector
                  value={field.value}
                  onChange={field.onChange}
                  accessToken={accessToken}
                  placeholder={t("create.selectVectorStoresOptional")}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="mcp"
              label={t("create.allowedMcpServers")}
              description={t("create.allowedMcpServersDescription")}
            >
              {(field) => (
                <MCPServerSelector
                  value={field.value}
                  onChange={field.onChange}
                  accessToken={accessToken}
                  placeholder={t("create.selectMcpServersOptional")}
                />
              )}
            </FormField>

            <FormField control={form.control} name="metadata" label={t("field.metadata")}>
              {({ ref, ...field }) => <Textarea {...field} ref={ref} rows={4} />}
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("create.creating") : t("create.title")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
