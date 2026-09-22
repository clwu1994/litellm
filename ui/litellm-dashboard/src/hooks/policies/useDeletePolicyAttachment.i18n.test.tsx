import React from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { deletePolicyAttachmentCall } from "@/components/networking";

import { useDeletePolicyAttachment } from "./useDeletePolicyAttachment";

vi.mock("@/components/networking", () => ({
  deletePolicyAttachmentCall: vi.fn(),
}));

describe("useDeletePolicyAttachment Chinese toasts", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(async () => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("toasts the Chinese delete success and hides the English", async () => {
    const onSuccess = vi.fn();
    vi.mocked(deletePolicyAttachmentCall).mockResolvedValue({});

    const { result } = renderHook(() => useDeletePolicyAttachment({ accessToken: "test-token", onSuccess }), {
      wrapper,
    });

    result.current.mutate("attachment-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith("附件删除成功");
    expect(toast.success).not.toHaveBeenCalledWith("Attachment deleted successfully");
    expect(onSuccess).toHaveBeenCalled();
  });

  it("toasts the Chinese delete failure and hides the English", async () => {
    const onError = vi.fn();
    const error = new Error("Delete failed");
    vi.mocked(deletePolicyAttachmentCall).mockRejectedValue(error);

    const { result } = renderHook(() => useDeletePolicyAttachment({ accessToken: "test-token", onError }), {
      wrapper,
    });

    result.current.mutate("attachment-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("删除附件失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete attachment");
    expect(onError).toHaveBeenCalledWith(error);
  });
});
