"use client";

import React, { useMemo, useState } from "react";
import { CircleHelp, Info, Plug } from "lucide-react";
import type { TFunction } from "i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useTranslation } from "react-i18next";
import { useWatch } from "react-hook-form";
import { z } from "zod/v4";

import { createPassThroughEndpoint } from "./networking";
import NumericalInput from "./shared/numerical_input";
import KeyValueInput, { type KeyValuePair } from "./key_value_input";
import QueryParamInput from "./query_param_input";
import { passThroughItem } from "./PassThroughSettings/PassThroughSettings";
import RoutePreview from "./route_preview";
import { toast } from "@/lib/toast";
import PassThroughSecuritySection from "./common_components/PassThroughSecuritySection";
import PassThroughGuardrailsSection from "./common_components/PassThroughGuardrailsSection";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const HTTP_METHOD_OPTIONS = HTTP_METHODS.map((method) => ({ label: method, value: method }));

type GuardrailSettings = Record<string, { request_fields?: string[]; response_fields?: string[] } | null>;

const keyValuePairsSchema = z.array(z.tuple([z.string(), z.string()]));

const createPassThroughFormSchema = (t: TFunction<"models">) =>
  z.object({
    path: z
      .string()
      .min(1, t("passThrough.add.validationPathRequired"))
      .regex(/^\//, t("passThrough.add.validationPathRequired")),
    target: z
      .string()
      .min(1, t("passThrough.add.validationTargetRequired"))
      .pipe(z.url({ error: t("passThrough.add.validationTargetInvalid") })),
    methods: z.array(z.string()).optional(),
    include_subpath: z.boolean(),
    headers: keyValuePairsSchema.refine((pairs) => pairs.some(([name]) => name !== ""), {
      error: t("passThrough.add.validationHeadersRequired"),
    }),
    default_query_params: keyValuePairsSchema.optional(),
    auth: z.boolean().optional(),
    timeout: z.string().optional(),
    cost_per_request: z.string().optional(),
  });

type PassThroughFormValues = z.output<ReturnType<typeof createPassThroughFormSchema>>;

const emptyFormValues = {
  path: "",
  target: "",
  methods: undefined,
  include_subpath: true,
  headers: [],
  default_query_params: undefined,
  auth: undefined,
  timeout: undefined,
  cost_per_request: undefined,
} as unknown as PassThroughFormValues;

const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const optionalText = (raw: string): string | undefined => (raw === "" ? undefined : raw);

const toRecord = (pairs: readonly KeyValuePair[]): Record<string, string> =>
  Object.fromEntries(pairs.filter(([name]) => name !== ""));

const optionalRecord = (pairs: readonly KeyValuePair[] | undefined): Record<string, string> | undefined => {
  const record = toRecord(pairs ?? []);
  return Object.keys(record).length > 0 ? record : undefined;
};

interface AddFallbacksProps {
  accessToken: string;
  passThroughItems: passThroughItem[];
  setPassThroughItems: React.Dispatch<React.SetStateAction<passThroughItem[]>>;
  premiumUser?: boolean;
}

const AddPassThroughEndpoint: React.FC<AddFallbacksProps> = ({
  accessToken,
  setPassThroughItems,
  passThroughItems,
  premiumUser = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guardrails, setGuardrails] = useState<GuardrailSettings>({});
  const { t } = useTranslation("models");
  const schema = useMemo(() => createPassThroughFormSchema(t), [t]);
  const form = useZodForm(schema, { defaultValues: emptyFormValues });

  const pathValue = useWatch({ control: form.control, name: "path" });
  const targetValue = useWatch({ control: form.control, name: "target" });
  const includeSubpath = useWatch({ control: form.control, name: "include_subpath" });
  const selectedMethods = useWatch({ control: form.control, name: "methods" }) ?? [];

  const handleCancel = () => {
    form.reset(emptyFormValues);
    setGuardrails({});
    setIsModalVisible(false);
  };

  const addPassThrough = async (values: PassThroughFormValues) => {
    setIsLoading(true);
    try {
      const formValues = {
        path: values.path,
        target: values.target,
        methods: values.methods,
        include_subpath: values.include_subpath,
        headers: toRecord(values.headers),
        default_query_params: optionalRecord(values.default_query_params),
        ...(premiumUser ? { auth: values.auth } : {}),
        timeout: values.timeout,
        cost_per_request: values.cost_per_request,
        ...(Object.keys(guardrails).length > 0 ? { guardrails } : {}),
      };

      const response = await createPassThroughEndpoint(accessToken, formValues);
      const createdEndpoint = response.endpoints[0];

      setPassThroughItems([...passThroughItems, createdEndpoint]);

      toast.success(t("passThrough.add.toastCreated"));
      form.reset(emptyFormValues);
      setGuardrails({});
      setIsModalVisible(false);
    } catch (error) {
      toast.fromError(t("passThrough.add.toastCreateFailed", { error: String(error) }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div>
        <Button className="mx-auto mb-4 mt-4" onClick={() => setIsModalVisible(true)}>
          {t("passThrough.add.button")}
        </Button>
        <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="top-8 max-h-[calc(100dvh-4rem)] translate-y-0 overflow-y-auto sm:max-w-[1000px]">
            <DialogHeader>
              <div className="flex items-center space-x-3 border-b border-border pb-4">
                <Plug className="size-5 text-info" />
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {t("passThrough.add.title")}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="mt-6">
              <Alert variant="info" className="mb-6">
                <Info />
                <AlertTitle>{t("passThrough.add.whatIsTitle")}</AlertTitle>
                <AlertDescription>{t("passThrough.add.whatIsBody")}</AlertDescription>
              </Alert>

              <form onSubmit={form.handleSubmit(addPassThrough)} className="space-y-6">
                <Card className="block p-5">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("passThrough.add.routeConfigTitle")}
                  </h3>
                  <p className="mb-5 text-sm text-muted-foreground">{t("passThrough.add.routeConfigDescription")}</p>

                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="path"
                      label={t("passThrough.add.pathPrefix")}
                      description={t("passThrough.add.pathPrefixDescription")}
                    >
                      {({ value, onChange, ...field }) => (
                        <Input
                          {...field}
                          placeholder="bria"
                          value={value ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value;
                            onChange(raw && !raw.startsWith("/") ? "/" + raw : raw);
                          }}
                        />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="target"
                      label={t("passThrough.add.targetUrl")}
                      description={t("passThrough.add.targetUrlDescription")}
                    >
                      {({ value, ...field }) => (
                        <Input {...field} placeholder="https://engine.prod.bria-api.com" value={value ?? ""} />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="methods"
                      label={labelWithHint(t("passThrough.methods.label"), t("passThrough.methods.hint"))}
                      description={
                        selectedMethods.length === 0
                          ? t("passThrough.methods.allSupported")
                          : t("passThrough.methods.onlySelected", { methods: selectedMethods.join(", ") })
                      }
                    >
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <Select multiple items={HTTP_METHOD_OPTIONS} value={value ?? []} onValueChange={onChange}>
                          <SelectTrigger {...field} className="w-full">
                            <SelectValue placeholder={t("passThrough.methods.placeholder")}>
                              {(selected: string[]) =>
                                selected.length === 0 ? t("passThrough.methods.placeholder") : selected.join(", ")
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {HTTP_METHODS.map((method) => (
                              <SelectItem key={method} value={method} title={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t("passThrough.add.includeSubpaths")}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t("passThrough.add.includeSubpathsDescription")}
                        </div>
                      </div>
                      <FormField control={form.control} name="include_subpath">
                        {({ value, onChange, ref: _ref, ...field }) => (
                          <Switch {...field} checked={value} onCheckedChange={onChange} />
                        )}
                      </FormField>
                    </div>
                  </div>
                </Card>

                <RoutePreview pathValue={pathValue} targetValue={targetValue} includeSubpath={includeSubpath} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("passThrough.add.headersTitle")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{t("passThrough.add.headersDescription")}</p>

                  <FormField
                    control={form.control}
                    name="headers"
                    label={labelWithHint(t("passThrough.add.authHeadersLabel"), t("passThrough.add.authHeadersHint"))}
                    description={
                      <>
                        <span className="mb-1 block font-medium">
                          {t("passThrough.add.authHeadersDescriptionStrong")}
                        </span>
                        <span className="block">{t("passThrough.add.authHeadersDescriptionExamples")}</span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <KeyValueInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("passThrough.add.queryParamsTitle")}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">{t("passThrough.add.queryParamsDescription")}</p>

                  <FormField
                    control={form.control}
                    name="default_query_params"
                    label={labelWithHint(t("passThrough.add.queryParamsLabel"), t("passThrough.add.queryParamsHint"))}
                    description={
                      <>
                        <span className="mb-1 block font-medium">
                          {t("passThrough.add.queryParamsDescriptionStrong")}
                        </span>
                        <span className="block">{t("passThrough.add.queryParamsDescriptionExamples")}</span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <QueryParamInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <FormField control={form.control} name="auth">
                  {({ value, onChange }) => (
                    <PassThroughSecuritySection
                      premiumUser={premiumUser}
                      authEnabled={value ?? false}
                      onAuthChange={onChange}
                    />
                  )}
                </FormField>

                <PassThroughGuardrailsSection accessToken={accessToken} value={guardrails} onChange={setGuardrails} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("passThrough.add.performanceTitle")}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">{t("passThrough.add.performanceDescription")}</p>

                  <FormField
                    control={form.control}
                    name="timeout"
                    label={labelWithHint(t("passThrough.add.timeoutLabel"), t("passThrough.add.timeoutHint"))}
                    description={t("passThrough.add.timeoutDescription")}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={1}
                        step={1}
                        placeholder="600"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("passThrough.add.billingTitle")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{t("passThrough.add.billingDescription")}</p>

                  <FormField
                    control={form.control}
                    name="cost_per_request"
                    label={labelWithHint(t("passThrough.add.costLabel"), t("passThrough.add.costHint"))}
                    description={t("passThrough.add.costDescription")}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={0}
                        step={0.001}
                        placeholder="2.0000"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <div className="flex items-center justify-end space-x-3 border-t border-border pt-6">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t("passThrough.cancel")}
                  </Button>
                  <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading && <UiLoadingSpinner className="size-4" />}
                    {isLoading ? t("passThrough.add.creating") : t("passThrough.add.title")}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AddPassThroughEndpoint;
