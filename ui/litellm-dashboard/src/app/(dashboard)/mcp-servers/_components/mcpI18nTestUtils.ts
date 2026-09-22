import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

import { screen, waitFor } from "@/../tests/test-utils";

export const expectPair = (zh: string, en: string): void => {
  expect(screen.getAllByText(zh)[0]).toBeInTheDocument();
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

export const openTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string): Promise<HTMLElement> => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

export const expectTooltipPair = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  zh: string,
  en: string,
): Promise<void> => {
  const tooltip = await openTooltip(user, label);
  expect(tooltip).toHaveTextContent(zh);
  expect(tooltip).not.toHaveTextContent(en);
};
