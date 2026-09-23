import type { UseQueryResult } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import type { HealthReadinessDetailsResponse } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "@/i18n/bootstrapI18n";

import { DebugWarningBanner } from "./DebugWarningBanner";
import { EnvCredentialLoginWarningBanner } from "./EnvCredentialLoginWarningBanner";
import { NoRedisWarningBanner } from "./NoRedisWarningBanner";

vi.mock("@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails", () => ({
  useHealthReadinessDetails: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

const mockDetails = (data: Partial<HealthReadinessDetailsResponse> | undefined) => {
  vi.mocked(useHealthReadinessDetails).mockReturnValue({ data } as UseQueryResult<HealthReadinessDetailsResponse>);
};

const ENV_TITLE_EN = "Environment-credential login is enabled";
const ENV_TITLE_ZH = "已启用环境变量凭据登录";
const ENV_BODY_EN =
  "Anyone with UI_USERNAME/UI_PASSWORD (or the master key, when UI_PASSWORD is unset) can sign in as a proxy admin with a shared static secret. First create a regular admin account with its own password, then set general_settings.disable_env_credential_login: true to turn this login path off.";
const ENV_BODY_ZH =
  "任何拥有 UI_USERNAME/UI_PASSWORD（或在未设置 UI_PASSWORD 时持有 master key）的人，都可以使用共享的静态密钥以代理管理员身份登录。请先创建一个拥有独立密码的普通管理员账号，然后设置 general_settings.disable_env_credential_login: true 来关闭此登录方式。";

const REDIS_TITLE_EN = "No Redis configured. Redis is highly recommended";
const REDIS_TITLE_ZH = "未配置 Redis。强烈建议使用 Redis";
const REDIS_BODY_EN =
  "This proxy is running more than one worker (or the worker count could not be verified). Without Redis, rate limits, budgets, router state, and cache invalidation are per worker, so limits are enforced once per worker and spend can overshoot. See everything that does not work without Redis. Set LITELLM_DISABLE_NO_REDIS_WARNING=true to hide this banner anyway.";
const REDIS_BODY_ZH =
  "此代理运行了多个 worker（或无法确认 worker 数量）。没有 Redis 时，速率限制、预算、路由器状态和缓存失效都是按 worker 独立的，因此限制会对每个 worker 分别生效，消费可能超出预期。查看没有 Redis 时无法工作的全部功能。设置 LITELLM_DISABLE_NO_REDIS_WARNING=true 仍可隐藏此横幅。";
const REDIS_LINK_EN = "See everything that does not work without Redis";
const REDIS_LINK_ZH = "查看没有 Redis 时无法工作的全部功能";

const DEBUG_TITLE_EN = "Performance Warning: Detailed Debug Mode Active";
const DEBUG_TITLE_ZH = "性能警告：详细调试模式已启用";
const DEBUG_BODY_EN =
  "Detailed debug logging (LITELLM_LOG=DEBUG) is currently enabled. This mode logs extensive diagnostic information and will significantly degrade performance. It should only be used for troubleshooting and disabled in production environments.";
const DEBUG_BODY_ZH =
  "详细调试日志（LITELLM_LOG=DEBUG）当前已启用。此模式会记录大量诊断信息，并会显著降低性能。它应仅用于故障排查，在生产环境中请关闭。";

describe("shell warning banner Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useAuth).mockReturnValue({ userRole: "Admin" } as ReturnType<typeof useAuth>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese environment-credential title and body and hides the English originals", () => {
    mockDetails({ status: "healthy", show_env_credential_login_warning: true });

    renderWithProviders(<EnvCredentialLoginWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(ENV_TITLE_ZH);
    expect(alert).not.toHaveTextContent(ENV_TITLE_EN);
    expect(alert).toHaveTextContent(ENV_BODY_ZH);
    expect(alert).not.toHaveTextContent(ENV_BODY_EN);
  });

  it("renders the Chinese dismiss aria-label and hides the English original", () => {
    mockDetails({ status: "healthy", show_env_credential_login_warning: true });

    renderWithProviders(<EnvCredentialLoginWarningBanner accessToken="token" />);

    expect(screen.getByRole("button", { name: "关闭横幅" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss banner" })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-Redis title, body and link and hides the English originals", () => {
    mockDetails({ status: "healthy", show_no_redis_warning: true });

    renderWithProviders(<NoRedisWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(REDIS_TITLE_ZH);
    expect(alert).not.toHaveTextContent(REDIS_TITLE_EN);
    expect(alert).toHaveTextContent(REDIS_BODY_ZH);
    expect(alert).not.toHaveTextContent(REDIS_BODY_EN);
    expect(screen.getByRole("link", { name: REDIS_LINK_ZH })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: REDIS_LINK_EN })).not.toBeInTheDocument();
  });

  it("renders the Chinese detailed-debug title and body and hides the English originals", () => {
    mockDetails({ is_detailed_debug: true });

    renderWithProviders(<DebugWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(DEBUG_TITLE_ZH);
    expect(alert).not.toHaveTextContent(DEBUG_TITLE_EN);
    expect(alert).toHaveTextContent(DEBUG_BODY_ZH);
    expect(alert).not.toHaveTextContent(DEBUG_BODY_EN);
  });
});

describe("shell warning banner English copy stays byte-identical", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useAuth).mockReturnValue({ userRole: "Admin" } as ReturnType<typeof useAuth>);
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the env-credential banner with the pre-catalog English text", () => {
    mockDetails({ status: "healthy", show_env_credential_login_warning: true });

    renderWithProviders(<EnvCredentialLoginWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(ENV_TITLE_EN);
    expect(alert).toHaveTextContent(ENV_BODY_EN);
    expect(screen.getByRole("button", { name: "Dismiss banner" })).toBeInTheDocument();
  });

  it("renders the no-Redis banner with the pre-catalog English text", () => {
    mockDetails({ status: "healthy", show_no_redis_warning: true });

    renderWithProviders(<NoRedisWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(REDIS_TITLE_EN);
    expect(alert).toHaveTextContent(REDIS_BODY_EN);
    expect(screen.getByRole("link", { name: REDIS_LINK_EN })).toBeInTheDocument();
  });

  it("renders the detailed-debug banner with the pre-catalog English text", () => {
    mockDetails({ is_detailed_debug: true });

    renderWithProviders(<DebugWarningBanner accessToken="token" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(DEBUG_TITLE_EN);
    expect(alert).toHaveTextContent(DEBUG_BODY_EN);
  });
});
