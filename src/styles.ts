export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rfm-primary";

export const ROW_TRANSITION = "transition-colors duration-150";

export const ICON_BUTTON = cn(
  "inline-flex shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-gray-500 hover:bg-black/[0.06] hover:text-gray-900",
  ROW_TRANSITION,
  FOCUS_RING,
);

export const DROP_TARGET_CLASS = "bg-rfm-hover outline-dashed outline-2 outline-rfm-primary";
