import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { ClassifyTag } from "./ClassifyTag";

describe("ClassifyTag", () => {
  it("renders for an auto-router classifier row", () => {
    render(<ClassifyTag origin="autorouter_classifier" />);
    expect(screen.getByText("Classify")).toBeInTheDocument();
  });

  it("renders nothing for ordinary traffic, which is what makes the tag meaningful", () => {
    const { container } = render(<ClassifyTag origin={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an unrecognized origin rather than labelling it as a classifier call", () => {
    const { container } = render(<ClassifyTag origin="something_else" />);
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

    it("renders the Chinese badge and tooltip and hides the English ones", () => {
      render(<ClassifyTag origin="autorouter_classifier" />);

      expect(screen.getByText("分类")).toBeInTheDocument();
      expect(screen.getByTitle("自动路由发起的层级分类调用，并非调用方发送的请求")).toBeInTheDocument();
      expect(screen.queryByText("Classify")).not.toBeInTheDocument();
      expect(
        screen.queryByTitle("Tier classification call made by the auto-router, not a request the caller sent"),
      ).not.toBeInTheDocument();
    });
  });
});
