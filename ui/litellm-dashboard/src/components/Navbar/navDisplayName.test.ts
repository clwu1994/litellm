import { describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { navAccountDisplayName } from "./navDisplayName";

const en = i18n.getFixedT("en", "nav");
const zh = i18n.getFixedT("zh", "nav");

describe("navAccountDisplayName", () => {
  it("should prefer email when present", () => {
    expect(navAccountDisplayName("x@y.com", "ignored", en)).toBe("x@y.com");
  });

  it("should map default_user_id placeholder to Account", () => {
    expect(navAccountDisplayName(null, "default_user_id", en)).toBe("Account");
    expect(navAccountDisplayName(null, "DEFAULT_USER_ID", en)).toBe("Account");
  });

  it("should translate the placeholder fallback from the catalog", () => {
    expect(navAccountDisplayName(null, "default_user_id", zh)).toBe("账户");
    expect(navAccountDisplayName(null, null, zh)).toBe("账户");
  });

  it("should show a sensible token when user id is non-placeholder", () => {
    expect(navAccountDisplayName(null, "user-uuid-123", en)).toBe("user-uuid-123");
  });
});
