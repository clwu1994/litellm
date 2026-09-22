import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { formatExpiryDate } from "@/utils/licenseUtils";

import { LicenseExpiryBannerView } from "./LicenseExpiryBanner";
import { LicenseInfo } from "./networking";

const daysFromNow = (n: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
};

const licenseWith = (expiration_date: string | null): LicenseInfo => ({
  has_license: expiration_date !== null,
  license_type: expiration_date !== null ? "enterprise" : "community",
  expiration_date,
  allowed_features: [],
  limits: { max_users: null, max_teams: null },
});

describe("LicenseExpiryBannerView", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders nothing when there is no license info", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when expiration_date is null (community or remote-validated)", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(null)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when expiry is more than 30 days out", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(40))} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a dismissible warning within 30 days", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(20))} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector(".lucide-triangle-alert")).toBeInTheDocument();
    expect(screen.getByText(/expires in 20 days/)).toBeInTheDocument();
    expect(screen.getByText(/Renew before it lapses to keep enterprise features/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sales@berri.ai" })).toHaveAttribute("href", "mailto:sales@berri.ai");
  });

  it("shows a non-dismissible critical alert within 7 days", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(5))} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector(".lucide-circle-alert")).toBeInTheDocument();
    expect(screen.getByText(/expires in 5 days/)).toBeInTheDocument();
    expect(screen.getByText(/Renew now to avoid losing enterprise features/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says 'expires today' on the expiration day", () => {
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(0))} />);
    expect(screen.getByText(/expires today/)).toBeInTheDocument();
  });

  it("shows a non-dismissible expired alert stating features are disabled", () => {
    const { container } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(-3))} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector(".lucide-circle-alert")).toBeInTheDocument();
    expect(screen.getByText(/expired on/)).toBeInTheDocument();
    expect(screen.getByText(/features are now disabled/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides the warning after dismissal and stays hidden within the session", () => {
    const expiration = daysFromNow(20);
    const { unmount } = render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText(/expires in 20 days/)).not.toBeInTheDocument();

    unmount();
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);
    expect(screen.queryByText(/expires in 20 days/)).not.toBeInTheDocument();
  });

  it("still shows a critical alert even when its date was previously dismissed", () => {
    const expiration = daysFromNow(5);
    sessionStorage.setItem(`litellm:licenseExpiryBannerDismissed:${expiration}`, "true");
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);
    expect(screen.getByText(/expires in 5 days/)).toBeInTheDocument();
  });
});

describe("LicenseExpiryBannerView Chinese copy", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    sessionStorage.clear();
    await i18n.changeLanguage("en");
  });

  it("renders the warning countdown and renewal copy in Chinese", () => {
    const expiration = daysFromNow(20);
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      `你的 LiteLLM 企业版许可证20 天后到期（${formatExpiryDate(expiration)}）请在到期前续订以保留企业版功能。请联系 sales@berri.ai`,
    );
    expect(alert).not.toHaveTextContent("expires in 20 days");
    expect(alert).not.toHaveTextContent("Renew before it lapses to keep enterprise features");
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sales@berri.ai" })).toHaveAttribute("href", "mailto:sales@berri.ai");
  });

  it("renders the critical countdown and copy in Chinese", () => {
    const expiration = daysFromNow(5);
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      `你的 LiteLLM 企业版许可证5 天后到期（${formatExpiryDate(expiration)}）请立即续订以免失去企业版功能。请联系 sales@berri.ai`,
    );
    expect(alert).not.toHaveTextContent("Renew now to avoid losing enterprise features");
  });

  it("renders the one-day and same-day countdowns in Chinese", () => {
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(1))} />);
    expect(screen.getByRole("alert")).toHaveTextContent("1 天后到期");
    expect(screen.getByRole("alert")).not.toHaveTextContent("expires in 1 day");

    cleanup();
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(daysFromNow(0))} />);
    expect(screen.getByRole("alert")).toHaveTextContent("今天到期");
    expect(screen.getByRole("alert")).not.toHaveTextContent("expires today");
  });

  it("renders the expired message and disabled-features copy in Chinese", () => {
    const expiration = daysFromNow(-3);
    render(<LicenseExpiryBannerView licenseInfo={licenseWith(expiration)} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      `你的 LiteLLM 企业版许可证已于 ${formatExpiryDate(expiration)} 到期企业版功能现已停用。请联系 sales@berri.ai 以恢复访问`,
    );
    expect(alert).not.toHaveTextContent("expired on");
    expect(alert).not.toHaveTextContent("Enterprise features are now disabled");
  });
});
