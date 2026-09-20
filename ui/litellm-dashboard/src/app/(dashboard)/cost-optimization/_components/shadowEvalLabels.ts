import type { ParseKeys } from "i18next";

import type { ShadowEvalJob, ShadowEvalJobTarget } from "./useShadowEval";

export const SHADOW_EVAL_STATUS_KEYS: Record<ShadowEvalJob["status"], ParseKeys<"costTracking">> = {
  running: "shadowEval.status.running",
  completed: "shadowEval.status.completed",
  stopped: "shadowEval.status.stopped",
};

type ShadowEvalTargetTypeTag = Exclude<ShadowEvalJobTarget["target_type"], "key">;

export const SHADOW_EVAL_TARGET_TYPE_KEYS: Record<ShadowEvalTargetTypeTag, ParseKeys<"costTracking">> = {
  team: "shadowEval.targetType.team",
  user: "shadowEval.targetType.user",
};
