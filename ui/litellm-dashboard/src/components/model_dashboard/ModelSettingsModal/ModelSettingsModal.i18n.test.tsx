import { useProxyConfig } from "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig";
import { useStoreModelInDB } from "@/app/(dashboard)/hooks/storeModelInDB/useStoreModelInDB";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { renderWithProviders } from "../../../../tests/test-utils";
import ModelSettingsModal from "./ModelSettingsModal";

vi.mock("@/app/(dashboard)/hooks/storeModelInDB/useStoreModelInDB");
vi.mock("@/app/(dashboard)/hooks/proxyConfig/useProxyConfig");
vi.mock("@/components/shared/errorUtils", () => ({ parseErrorMessage: vi.fn() }));

const mockUseStoreModelInDB = vi.mocked(useStoreModelInDB);
const mockUseProxyConfig = vi.mocked(useProxyConfig);

describe("ModelSettingsModal Chinese copy", () => {
  beforeEach(async () => {
    mockUseStoreModelInDB.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    mockUseProxyConfig.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese title, store label and cancel button", () => {
    renderWithProviders(<ModelSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("模型设置")).toBeInTheDocument();
    expect(screen.queryByText("Model Settings")).not.toBeInTheDocument();
    expect(screen.getByText("将模型存储到数据库")).toBeInTheDocument();
    expect(screen.queryByText("Store Model in DB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
