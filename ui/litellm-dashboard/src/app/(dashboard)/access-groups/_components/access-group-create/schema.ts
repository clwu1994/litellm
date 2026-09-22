import type { TFunction } from "i18next";
import { z } from "zod/v4";

export const accessGroupCreateSchema = (t: TFunction<"accessGroups">) =>
  z.object({
    name: z.string().refine((value) => value.trim() !== "", t("validation.nameRequired")),
    description: z.string(),
    modelIds: z.array(z.string()),
    mcpServerIds: z.array(z.string()),
    agentIds: z.array(z.string()),
  });

type AccessGroupCreateSchema = ReturnType<typeof accessGroupCreateSchema>;

export type AccessGroupCreateFormValues = z.output<AccessGroupCreateSchema>;
