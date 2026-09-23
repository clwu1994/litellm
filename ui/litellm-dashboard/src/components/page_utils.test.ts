/**
 * Tests to ensure page metadata stays in sync with leftnav configuration
 * This catches issues when leftnav structure changes but page_utils/page_metadata aren't updated
 */

import { describe, it, expect } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { getAvailablePages } from "./page_utils";
import { menuGroups } from "./leftnav";
import { pageDescriptions } from "./page_metadata";
import { internalUserRoles } from "@/utils/roles";

/**
 * Check if a page is accessible to internal users
 * A page is accessible if:
 * 1. It has no role restrictions, OR
 * 2. Its roles include at least one internal user role
 */
const isPageAccessibleToInternalUsers = (pageRoles?: string[]): boolean => {
  if (!pageRoles || pageRoles.length === 0) {
    return true; // No role restrictions
  }

  // Check if any of the page's roles match internal user roles
  return pageRoles.some((role) => internalUserRoles.includes(role));
};

describe("Page Utils - LeftNav Sync", () => {
  const t = i18n.getFixedT(null, "nav");

  it("should return all pages from leftnav configuration", () => {
    const availablePages = getAvailablePages(t);

    // Should have pages
    expect(availablePages.length).toBeGreaterThan(0);

    // Each page should have required fields
    availablePages.forEach((page) => {
      expect(page).toHaveProperty("page");
      expect(page).toHaveProperty("label");
      expect(page).toHaveProperty("groupKey");
      expect(page).toHaveProperty("descriptionKey");
      expect(typeof page.page).toBe("string");
      expect(typeof page.label).toBe("string");
      expect(typeof page.groupKey).toBe("string");
      expect(typeof page.descriptionKey).toBe("string");
    });
  });

  it("should include all navigable pages from menuGroups", () => {
    const availablePages = getAvailablePages(t);
    const availablePageKeys = availablePages.map((p) => p.page);

    // Collect all page keys from menuGroups (excluding parent containers and pages not accessible to internal users)
    const menuPageKeys: string[] = [];
    const excludedParents = ["tools", "experimental", "settings"];

    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.page && !excludedParents.includes(item.page) && isPageAccessibleToInternalUsers(item.roles)) {
          menuPageKeys.push(item.page);
        }

        // Add children (only if accessible to internal users)
        if (item.children) {
          item.children.forEach((child) => {
            if (isPageAccessibleToInternalUsers(child.roles)) {
              menuPageKeys.push(child.page);
            }
          });
        }
      });
    });

    // Every menu page accessible to internal users should be in available pages
    menuPageKeys.forEach((pageKey) => {
      expect(availablePageKeys, `Page "${pageKey}" from menuGroups should be in getAvailablePages() output`).toContain(
        pageKey,
      );
    });
  });

  it("should not include parent container pages (tools, experimental, settings)", () => {
    const availablePages = getAvailablePages(t);
    const availablePageKeys = availablePages.map((p) => p.page);

    const excludedParents = ["tools", "experimental", "settings"];

    excludedParents.forEach((parent) => {
      expect(availablePageKeys, `Parent container "${parent}" should not be in available pages`).not.toContain(parent);
    });
  });

  it("should carry a catalog description key for all pages", () => {
    const availablePages = getAvailablePages(t);

    availablePages.forEach((page) => {
      expect(page.descriptionKey, `Page "${page.page}" should have a description key`).toMatch(/^descriptions\./);

      expect(page.descriptionKey, `Page "${page.page}" should not use the fallback description`).not.toBe(
        "descriptions.fallback",
      );
    });
  });

  it("resolves every page description key from the nav catalog in both locales", () => {
    const descriptionKeys = new Set(Object.values(pageDescriptions));
    expect(descriptionKeys.size).toBeGreaterThan(0);

    descriptionKeys.forEach((descriptionKey) => {
      const en = i18n.t(descriptionKey, { ns: "nav", lng: "en" });
      const zh = i18n.t(descriptionKey, { ns: "nav", lng: "zh" });

      expect(en, `${descriptionKey} should resolve in English`).not.toBe(descriptionKey);
      expect(zh, `${descriptionKey} should resolve in Chinese`).not.toBe(descriptionKey);
      expect(zh, `${descriptionKey} should be translated`).not.toBe(en);
    });
  });

  it("should have pageDescriptions entry for all navigable pages in menuGroups", () => {
    // Collect all page keys from menuGroups
    const menuPageKeys: string[] = [];
    const excludedParents = ["tools", "experimental", "settings"];

    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.page && !excludedParents.includes(item.page)) {
          menuPageKeys.push(item.page);
        }

        if (item.children) {
          item.children.forEach((child) => {
            menuPageKeys.push(child.page);
          });
        }
      });
    });

    // Every menu page should have a description
    const missingDescriptions: string[] = [];
    menuPageKeys.forEach((pageKey) => {
      if (!pageDescriptions[pageKey]) {
        missingDescriptions.push(pageKey);
      }
    });

    expect(
      missingDescriptions,
      `These pages are missing descriptions in page_metadata.ts: ${missingDescriptions.join(", ")}`,
    ).toHaveLength(0);
  });

  it("should not have orphaned descriptions (descriptions for pages not in menuGroups)", () => {
    // Collect all page keys from menuGroups
    const menuPageKeys: string[] = [];
    const excludedParents = ["tools", "experimental", "settings"];

    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.page && !excludedParents.includes(item.page)) {
          menuPageKeys.push(item.page);
        }

        if (item.children) {
          item.children.forEach((child) => {
            menuPageKeys.push(child.page);
          });
        }
      });
    });

    // Check for descriptions that don't match any menu page
    const orphanedDescriptions: string[] = [];
    Object.keys(pageDescriptions).forEach((descKey) => {
      if (!menuPageKeys.includes(descKey)) {
        orphanedDescriptions.push(descKey);
      }
    });

    expect(
      orphanedDescriptions,
      `These descriptions don't match any page in menuGroups: ${orphanedDescriptions.join(", ")}. Remove them or add the pages to leftnav.`,
    ).toHaveLength(0);
  });

  it("should carry a neutral group key and parent key for nested pages", () => {
    const availablePages = getAvailablePages(t);

    // Find pages that should be nested (children of Tools, Experimental, Settings)
    const nestedPages = availablePages.filter((page) => page.parentKey !== undefined);

    // Each nested page should point at a valid nav section key and a valid parent item key.
    nestedPages.forEach((page) => {
      const groupKeys = menuGroups.map((g) => g.groupKey);
      expect(
        groupKeys,
        `Group key "${page.groupKey}" for page "${page.page}" should be a valid nav section key`,
      ).toContain(page.groupKey);
      expect(page.parentKey, `Nested page "${page.page}" should carry a parent item key`).toMatch(/^items\./);
    });
  });

  it("should have unique page keys", () => {
    const availablePages = getAvailablePages(t);
    const pageKeys = availablePages.map((p) => p.page);
    const uniquePageKeys = new Set(pageKeys);

    expect(pageKeys.length, "All page keys should be unique (no duplicates)").toBe(uniquePageKeys.size);
  });

  it("should match the language-neutral grouping PageVisibilitySettings performs", () => {
    const availablePages = getAvailablePages(t);

    // Same grouping key as PageVisibilitySettings: section key plus optional parent key.
    const grouped: Record<string, typeof availablePages> = {};
    availablePages.forEach((page) => {
      const key = page.parentKey ? `${page.groupKey} > ${page.parentKey}` : page.groupKey;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(page);
    });

    // Should have multiple groups
    expect(Object.keys(grouped).length).toBeGreaterThan(1);

    // Each group should have at least one page and a language-neutral key
    Object.entries(grouped).forEach(([groupKey, pages]) => {
      expect(pages.length, `Group "${groupKey}" should have at least one page`).toBeGreaterThan(0);
      expect(groupKey, `Group key "${groupKey}" should be language-neutral`).toMatch(/^section\./);
    });
  });

  it("localizes page labels while keeping the group key language-neutral", () => {
    const zhPages = getAvailablePages(i18n.getFixedT("zh", "nav"));
    const usage = zhPages.find((page) => page.page === "new_usage");

    expect(usage?.label).toBe("用量");
    expect(usage?.groupKey).toBe("section.observability");
    expect(i18n.t("section.observability", { ns: "nav", lng: "zh" })).toBe("可观测性");
    expect(zhPages.every((page) => page.groupKey.startsWith("section."))).toBe(true);
  });
});
