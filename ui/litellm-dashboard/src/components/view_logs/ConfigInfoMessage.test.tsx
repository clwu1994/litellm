import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigInfoMessage } from "./ConfigInfoMessage";
import i18n from "@/i18n/bootstrapI18n";

describe("ConfigInfoMessage", () => {
  it("should render the info message when show is true", () => {
    render(<ConfigInfoMessage show={true} />);
    expect(screen.getByText("Request/Response Data Not Available")).toBeInTheDocument();
  });

  it("should render nothing when show is false", () => {
    const { container } = render(<ConfigInfoMessage show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should display the YAML config snippet", () => {
    render(<ConfigInfoMessage show={true} />);
    expect(screen.getByText(/store_prompts_in_spend_logs: true/)).toBeInTheDocument();
  });

  it("should reference Admin Settings \u2192 Logging Settings", () => {
    render(<ConfigInfoMessage show={true} />);
    expect(screen.getByText(/Admin Settings → Logging Settings/)).toBeInTheDocument();
  });
});

describe("ConfigInfoMessage Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, body and note and hides the English ones", () => {
    render(<ConfigInfoMessage show={true} />);

    expect(screen.getByText("请求/响应数据不可用")).toBeInTheDocument();
    expect(screen.getByText(/要查看请求和响应详情/)).toBeInTheDocument();
    expect(screen.getByText("proxy_config.yaml")).toBeInTheDocument();
    expect(screen.getByText("管理设置中的日志设置")).toBeInTheDocument();
    expect(screen.getByText("注意：此更改仅对配置更改后的新请求生效。")).toBeInTheDocument();

    expect(screen.queryByText("Request/Response Data Not Available")).not.toBeInTheDocument();
    expect(screen.queryByText(/To view request and response details/)).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Settings → Logging Settings")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Note: This will only affect new requests after the configuration change."),
    ).not.toBeInTheDocument();
  });
});
