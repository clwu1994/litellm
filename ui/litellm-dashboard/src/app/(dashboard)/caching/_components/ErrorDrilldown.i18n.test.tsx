import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import {
  ErrorCodeTooltip,
  ErrorDrilldownCard,
  groupErrorBuckets,
  type CacheActivityErrorBucket,
} from "./ErrorDrilldown";

const BUCKETS: CacheActivityErrorBucket[] = [
  { call_type: "acompletion", error_code: "401", error_class: "AuthenticationError", count: 50 },
  { call_type: "acompletion", error_code: "429", error_class: "RateLimitError", count: 120 },
];

describe("ErrorDrilldown Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese error-code tooltip and hides the English original", () => {
    renderWithProviders(
      <ErrorCodeTooltip
        active
        label="429"
        payload={[{ payload: groupErrorBuckets(BUCKETS, "acompletion")[0], value: 120, graphicalItemId: "bar" }]}
      />,
    );

    expect(screen.getByText("错误码 429：120 次失败")).toBeInTheDocument();
    expect(screen.queryByText("Error code 429: 120 failed")).not.toBeInTheDocument();
  });

  it("renders the Chinese drilldown card chrome with the raw call type interpolated", () => {
    renderWithProviders(
      <ErrorDrilldownCard callType="acompletion" buckets={BUCKETS} valueFormatter={String} onClose={() => {}} />,
    );

    expect(screen.getByText("按错误码统计的失败请求：acompletion")).toBeInTheDocument();
    expect(screen.queryByText(/Failed requests by error code/)).not.toBeInTheDocument();
    expect(screen.getByText("将鼠标悬停在柱条上，查看该错误码背后的错误类。")).toBeInTheDocument();
    expect(screen.queryByText("Hover a bar to see the error classes behind that code.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭错误细分" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close error breakdown" })).not.toBeInTheDocument();
  });
});
