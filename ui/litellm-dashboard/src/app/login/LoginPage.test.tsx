import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/i18n/bootstrapI18n";
import LoginPage from "./LoginPage";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

vi.mock("@/app/(dashboard)/hooks/uiConfig/useUIConfig", () => ({
  useUIConfig: vi.fn(),
}));

vi.mock("@/utils/cookieUtils", () => ({
  clearTokenCookies: vi.fn(),
  getCookieFromDocument: vi.fn(),
}));

vi.mock("@/utils/jwtUtils", () => ({
  isJwtExpired: vi.fn(),
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return {
    ...actual,
    getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
  };
});

vi.mock("@/app/(dashboard)/hooks/login/useLogin", () => ({
  useLogin: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock("@/hooks/useWorker", () => ({
  useWorker: vi.fn(() => ({
    isControlPlane: false,
    workers: [],
    selectedWorkerId: null,
    selectedWorker: null,
    selectWorker: vi.fn(),
    disconnectFromWorker: vi.fn(),
  })),
}));

import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";
import { getCookieFromDocument } from "@/utils/cookieUtils";
import { isJwtExpired } from "@/utils/jwtUtils";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("should render", async () => {
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });
  });

  it("should call router.replace to dashboard when jwt is valid", async () => {
    const validToken = "valid-token";
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(validToken);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/ui");
    });
  });

  it("should call router.push to SSO when jwt is invalid and auto_redirect_to_sso is true", async () => {
    const invalidToken = "invalid-token";
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: true,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: true,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(invalidToken);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("http://localhost:4000/sso/key/generate");
    });
  });

  it("should not call router when jwt is invalid and auto_redirect_to_sso is false", async () => {
    const invalidToken = "invalid-token";
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(invalidToken);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should send user to dashboard when jwt is valid even if auto_redirect_to_sso is true", async () => {
    const validToken = "valid-token";
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: true,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: true,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(validToken);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/ui");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show alert when admin_ui_disabled is true", async () => {
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        admin_ui_disabled: true,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Admin UI Disabled")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should show Login with SSO button when sso_configured is true", async () => {
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: true,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Login with SSO" })).toBeInTheDocument();
  });

  it("should show disabled Login with SSO button with popover when sso_configured is false", async () => {
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    const ssoButton = screen.getByRole("button", { name: "Login with SSO" });
    expect(ssoButton).toBeInTheDocument();
    expect(ssoButton).toBeDisabled();
  });

  describe("URL ?token= legacy path is rejected (security regression test)", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          href: "http://localhost:3000/ui/login?token=attacker.jwt.value",
          pathname: "/ui/login",
          search: "?token=attacker.jwt.value",
        },
        writable: true,
      });
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    it("must not set a token cookie or redirect to /ui/?login=success when ?token= is in the URL", async () => {
      (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          auto_redirect_to_sso: false,
          server_root_path: "/",
          proxy_base_url: null,
          sso_configured: false,
        },
        isLoading: false,
      });
      (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const queryClient = createQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
      });

      expect(document.cookie).not.toContain("token=attacker.jwt.value");
      expect(mockReplace).not.toHaveBeenCalledWith("/ui/?login=success");
    });

    it("must not overwrite an existing valid session cookie when ?token= is in the URL", async () => {
      (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          auto_redirect_to_sso: false,
          server_root_path: "/",
          proxy_base_url: null,
          sso_configured: false,
        },
        isLoading: false,
      });
      (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue("legitimate-session-jwt");
      (isJwtExpired as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const queryClient = createQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/ui");
      });

      expect(document.cookie).not.toContain("token=attacker.jwt.value");
      expect(mockReplace).not.toHaveBeenCalledWith("/ui/?login=success");
    });
  });
});

describe("LoginPage localization", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  const renderLogin = async ({ ssoConfigured = false }: { ssoConfigured?: boolean } = {}) => {
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: ssoConfigured,
      },
      isLoading: false,
    });
    (getCookieFromDocument as ReturnType<typeof vi.fn>).mockReturnValue(null);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { level: 3 });
  };

  it("renders the Chinese login form and hides its English originals under zh", async () => {
    await i18n.changeLanguage("zh");
    await renderLogin();

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("登录");
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByText("默认凭据")).toBeInTheDocument();
    expect(screen.getByText(/默认情况下/)).toHaveTextContent(
      "默认情况下，用户名为 admin，密码为您设置的 LiteLLM Proxy MASTER_KEY。",
    );

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Username")).not.toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("Default Credentials")).not.toBeInTheDocument();
  });

  it("renders the English login form under en", async () => {
    await i18n.changeLanguage("en");
    await renderLogin();

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Login");
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByText("Default Credentials")).toBeInTheDocument();
    expect(screen.getByText(/By default/)).toHaveTextContent(
      "By default, Username is admin and Password is your set LiteLLM Proxy MASTER_KEY.",
    );

    expect(screen.queryByText("登录")).not.toBeInTheDocument();
    expect(screen.queryByText("用户名")).not.toBeInTheDocument();
  });

  it("renders the SSO notice from the catalog, keeping the env var in its code element, under zh", async () => {
    await i18n.changeLanguage("zh");
    await renderLogin({ ssoConfigured: true });

    const notice = screen.getByText(/已启用 SSO/);
    expect(notice).toHaveTextContent(
      "已启用 SSO。加载此页面时，LiteLLM 不再自动跳转到 SSO 登录流程。如需重新启用自动跳转到 SSO，请在环境配置中设置 AUTO_REDIRECT_UI_LOGIN_TO_SSO=true。",
    );
    expect(screen.getByText("AUTO_REDIRECT_UI_LOGIN_TO_SSO=true")).toHaveClass("bg-muted");

    expect(screen.queryByText(/Single Sign-On/)).not.toBeInTheDocument();
  });
});
