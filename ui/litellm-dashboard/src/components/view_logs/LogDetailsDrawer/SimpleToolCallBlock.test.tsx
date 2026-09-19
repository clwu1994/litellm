import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { SimpleToolCallBlock } from "./SimpleToolCallBlock";

describe("SimpleToolCallBlock", () => {
  it("should render the tool name", () => {
    render(<SimpleToolCallBlock tool={{ id: "1", name: "get_weather", arguments: {} }} />);
    expect(screen.getByText("get_weather")).toBeInTheDocument();
  });

  it('should display "function" badge', () => {
    render(<SimpleToolCallBlock tool={{ id: "1", name: "get_weather", arguments: {} }} />);
    expect(screen.getByText("function")).toBeInTheDocument();
  });

  it("should render arguments when present", () => {
    render(
      <SimpleToolCallBlock
        tool={{
          id: "1",
          name: "get_weather",
          arguments: { city: "London", units: "metric" },
        }}
      />,
    );
    expect(screen.getByText("city:")).toBeInTheDocument();
    expect(screen.getByText('"London"')).toBeInTheDocument();
    expect(screen.getByText("units:")).toBeInTheDocument();
    expect(screen.getByText('"metric"')).toBeInTheDocument();
  });

  it("should not render arguments section when arguments are empty", () => {
    render(<SimpleToolCallBlock tool={{ id: "1", name: "get_weather", arguments: {} }} />);
    // The tool name and "function" badge should be there, but no key: value pairs
    expect(screen.getByText("get_weather")).toBeInTheDocument();
    expect(screen.queryByText(/:$/)).not.toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese function badge and hides the English one", () => {
      render(<SimpleToolCallBlock tool={{ id: "1", name: "get_weather", arguments: {} }} />);

      expect(screen.getByText("函数")).toBeInTheDocument();
      expect(screen.queryByText("function")).not.toBeInTheDocument();
    });
  });
});
