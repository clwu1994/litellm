import type { TFunction } from "i18next";
import { z } from "zod/v4";

const sharedShape = (t: TFunction<"models">) => ({
  auto_router_name: z.string().min(1, t("editAutoRouter.validationNameRequired")),
  model_access_group: z.array(z.string()),
});

const complexityRouterShape = (t: TFunction<"models">) => ({
  ...sharedShape(t),
  auto_router_default_model: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  auto_router_embedding_model: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
});

const semanticRouterShape = (t: TFunction<"models">) => ({
  ...sharedShape(t),
  auto_router_default_model: z
    .string()
    .nullable()
    .pipe(
      z
        .string({ error: t("editAutoRouter.validationDefaultModelRequired") })
        .min(1, t("editAutoRouter.validationDefaultModelRequired")),
    ),
  auto_router_embedding_model: z
    .string()
    .nullable()
    .pipe(
      z
        .string({ error: t("editAutoRouter.validationEmbeddingModelRequired") })
        .min(1, t("editAutoRouter.validationEmbeddingModelRequired")),
    ),
});

export const buildComplexityRouterSchema = (t: TFunction<"models">) => z.object(complexityRouterShape(t));
export const buildSemanticRouterSchema = (t: TFunction<"models">) => z.object(semanticRouterShape(t));

export type EditAutoRouterFormValues = z.infer<ReturnType<typeof buildSemanticRouterSchema>>;

export const EMPTY_FORM_VALUES: z.input<ReturnType<typeof buildSemanticRouterSchema>> = {
  auto_router_name: "",
  auto_router_default_model: null,
  auto_router_embedding_model: null,
  model_access_group: [],
};
