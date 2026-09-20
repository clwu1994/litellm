import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import EndpointUsageTable from "./EndpointUsageTable";

describe("EndpointUsageTable", () => {
  it("should render", () => {
    const mockEndpointData = {
      "endpoint-1": {
        metrics: {
          spend: 100.5,
          prompt_tokens: 5000,
          completion_tokens: 3000,
          total_tokens: 8000,
          api_requests: 100,
          successful_requests: 95,
          failed_requests: 5,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        metadata: {},
        api_key_breakdown: {},
      },
    };

    renderWithProviders(<EndpointUsageTable endpointData={mockEndpointData} />);

    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Endpoint",
      "Successful / Failed",
      "Total Request",
      "Success Rate",
      "Total Tokens",
      "Spend",
    ]);
    expect(screen.getByText("endpoint-1")).toBeInTheDocument();
    expect(screen.getByText("95.00%")).toBeInTheDocument();
    expect(screen.getByText("$100.50")).toBeInTheDocument();
  });
});

describe("EndpointUsageTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  const endpointData = {
    "endpoint-1": {
      metrics: {
        spend: 100.5,
        prompt_tokens: 5000,
        completion_tokens: 3000,
        total_tokens: 8000,
        api_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
      metadata: {},
      api_key_breakdown: {},
    },
  };

  it("renders the Chinese column headers and hides the English ones", () => {
    renderWithProviders(<EndpointUsageTable endpointData={endpointData} />);

    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Endpoint",
      "成功 / 失败",
      "总请求数",
      "成功率",
      "总 Token 数",
      "支出",
    ]);
    expect(screen.queryByText("Successful / Failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Request")).not.toBeInTheDocument();
    expect(screen.queryByText("Success Rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Spend")).not.toBeInTheDocument();
  });

  it("renders the Chinese success meter label and hides the English one", () => {
    renderWithProviders(<EndpointUsageTable endpointData={endpointData} />);

    expect(screen.getByLabelText("成功请求")).toBeInTheDocument();
    expect(screen.queryByLabelText("Successful requests")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English one", () => {
    renderWithProviders(<EndpointUsageTable endpointData={{}} />);

    expect(screen.getByText("没有 Endpoint 用量数据")).toBeInTheDocument();
    expect(screen.queryByText("No endpoint usage data")).not.toBeInTheDocument();
  });
});
