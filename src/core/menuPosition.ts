export interface MenuRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface MenuSize {
  width: number;
  height: number;
}

export function insetMenuBounds(bounds: MenuRect): MenuRect {
  const horizontal = Math.min(4, Math.max(0, (bounds.right - bounds.left) / 2));
  const vertical = Math.min(4, Math.max(0, (bounds.bottom - bounds.top) / 2));
  return {
    left: bounds.left + horizontal,
    top: bounds.top + vertical,
    right: bounds.right - horizontal,
    bottom: bounds.bottom - vertical,
  };
}

export function positionMenu(
  bounds: MenuRect,
  anchor: MenuRect,
  size: MenuSize,
  gap: number,
  rtl: boolean
): { left: number; top: number; maxHeight: number } {
  const area = insetMenuBounds(bounds);
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const below = clamp(anchor.bottom + gap, area.top, area.bottom);
  const above = clamp(anchor.top - gap, area.top, area.bottom);
  const spaceBelow = area.bottom - below;
  const spaceAbove = above - area.top;
  const openAbove = size.height > spaceBelow && spaceAbove > spaceBelow;
  const maxHeight = openAbove ? spaceAbove : spaceBelow;

  const preferredLeft = rtl ? anchor.right - size.width : anchor.left;
  const alternateLeft = rtl ? anchor.left : anchor.right - size.width;
  const fits = (left: number) => left >= area.left && left + size.width <= area.right;
  const left = fits(preferredLeft)
    ? preferredLeft
    : fits(alternateLeft)
      ? alternateLeft
      : clamp(preferredLeft, area.left, Math.max(area.left, area.right - size.width));

  return {
    left,
    top: openAbove ? above - Math.min(size.height, maxHeight) : below,
    maxHeight,
  };
}
