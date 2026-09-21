export const findTooltipTrigger = (root: HTMLElement): Element => {
  const trigger = root.querySelector('[data-slot="tooltip-trigger"]');
  if (!(trigger instanceof Element)) {
    throw new Error("no tooltip trigger inside the given root");
  }
  return trigger;
};

export const findTooltipTriggerBeside = (label: HTMLElement): Element => {
  const container = label.parentElement;
  if (container === null) {
    throw new Error("label has no parent to search for a tooltip trigger");
  }
  return findTooltipTrigger(container);
};
