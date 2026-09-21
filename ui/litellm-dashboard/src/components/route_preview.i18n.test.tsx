import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import RoutePreview from "./route_preview";

vi.mock("./networking", () => ({
  getProxyBaseUrl: () => "https://proxy.example.com",
}));

describe("RoutePreview Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese route preview chrome for the subpath branch", () => {
    render(<RoutePreview pathValue="/bria" targetValue="https://engine.prod.bria-api.com" includeSubpath />);

    expect(screen.getByText("路由预览")).toBeInTheDocument();
    expect(screen.queryByText("Route Preview")).not.toBeInTheDocument();
    expect(screen.getByText("你的请求将如何被路由")).toBeInTheDocument();
    expect(screen.queryByText("How your requests will be routed")).not.toBeInTheDocument();
    expect(screen.getByText("基本路由：")).toBeInTheDocument();
    expect(screen.queryByText("Basic routing:")).not.toBeInTheDocument();
    expect(screen.getByText("你的 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Your endpoint")).not.toBeInTheDocument();
    expect(screen.getAllByText("转发到")).toHaveLength(2);
    expect(screen.queryByText("Forwards to")).not.toBeInTheDocument();
    expect(screen.getByText("带子路径时：")).toBeInTheDocument();
    expect(screen.queryByText("With subpaths:")).not.toBeInTheDocument();
    expect(screen.getByText("你的 Endpoint + 子路径")).toBeInTheDocument();
    expect(screen.queryByText("Your endpoint + subpath")).not.toBeInTheDocument();
    expect(screen.getByText("/bria 之后的任何路径都会追加到目标 URL")).toBeInTheDocument();
    expect(screen.queryByText("Any path after /bria will be appended to the target URL")).not.toBeInTheDocument();
  });

  it("renders the Chinese enable-subpaths hint for the exact-path branch", () => {
    render(<RoutePreview pathValue="/bria" targetValue="https://engine.prod.bria-api.com" includeSubpath={false} />);

    expect(screen.getByText("没有看到你想要的路由？")).toBeInTheDocument();
    expect(screen.queryByText("Not seeing the routing you wanted?")).not.toBeInTheDocument();
    expect(screen.getByText(/子路由就会被自动转发/)).toBeInTheDocument();
    expect(screen.queryByText(/forwarded automatically/)).not.toBeInTheDocument();
    expect(screen.getByText("/api/v1/models")).toBeInTheDocument();
  });
});
