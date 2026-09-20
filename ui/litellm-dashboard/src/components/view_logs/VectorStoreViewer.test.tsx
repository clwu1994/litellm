import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { VectorStoreViewer } from "./VectorStoreViewer";

const data = [
  {
    query: "find the docs",
    vector_store_id: "vs-1",
    custom_llm_provider: "openai",
    start_time: 1700000000,
    end_time: 1700000001,
    vector_store_search_response: {
      search_query: "find the docs",
      data: [{ score: 0.5, content: [{ type: "text", text: "a matching passage" }] }],
    },
  },
];

describe("VectorStoreViewer", () => {
  it("renders the request metadata and search results", () => {
    render(<VectorStoreViewer data={data} />);

    expect(screen.getByText("Vector Store Requests")).toBeInTheDocument();
    expect(screen.getByText("Query:")).toBeInTheDocument();
    expect(screen.getByText("find the docs")).toBeInTheDocument();
    expect(screen.getByText("Vector Store ID:")).toBeInTheDocument();
    expect(screen.getByText("vs-1")).toBeInTheDocument();
    expect(screen.getByText("Provider:")).toBeInTheDocument();
    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("Result 1")).toBeInTheDocument();
    expect(screen.getByText("0.5000")).toBeInTheDocument();
  });

  it("renders nothing when there is no data", () => {
    const { container } = render(<VectorStoreViewer data={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese section, field labels and result chrome and hides the English ones", () => {
      render(<VectorStoreViewer data={data} />);

      expect(screen.getByText("向量存储请求")).toBeInTheDocument();
      expect(screen.getByText("查询：")).toBeInTheDocument();
      expect(screen.getByText("向量存储 ID：")).toBeInTheDocument();
      expect(screen.getByText("提供商：")).toBeInTheDocument();
      expect(screen.getByText("开始时间：")).toBeInTheDocument();
      expect(screen.getByText("结束时间：")).toBeInTheDocument();
      expect(screen.getByText("耗时：")).toBeInTheDocument();
      expect(screen.getByText("搜索结果")).toBeInTheDocument();
      expect(screen.getByText("结果 1")).toBeInTheDocument();
      expect(screen.getByText("得分：")).toBeInTheDocument();

      expect(screen.queryByText("Vector Store Requests")).not.toBeInTheDocument();
      expect(screen.queryByText("Query:")).not.toBeInTheDocument();
      expect(screen.queryByText("Vector Store ID:")).not.toBeInTheDocument();
      expect(screen.queryByText("Provider:")).not.toBeInTheDocument();
      expect(screen.queryByText("Start Time:")).not.toBeInTheDocument();
      expect(screen.queryByText("End Time:")).not.toBeInTheDocument();
      expect(screen.queryByText("Duration:")).not.toBeInTheDocument();
      expect(screen.queryByText("Search Results")).not.toBeInTheDocument();
      expect(screen.queryByText("Result 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Score:")).not.toBeInTheDocument();
    });

    it("renders the Chinese provider logo alt text and hides the English one", () => {
      render(<VectorStoreViewer data={data} />);

      expect(screen.getByAltText("OpenAI 徽标")).toBeInTheDocument();
      expect(screen.queryByAltText("OpenAI logo")).not.toBeInTheDocument();
    });
  });
});
