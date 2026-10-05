type Anchor = { right: number; bottom: number };

type PlacementParams = {
  anchor: Anchor;
  menuWidth: number;
  viewportWidth: number;
  margin?: number;
};

type Placement = { left: number; top: number };

const clamp = (min: number, max: number, value: number) =>
  Math.max(min, Math.min(max, value));

// Menu hangs below the anchor, right-aligned to it, but never leaves the viewport
export const placeBelowAnchorRightAligned = ({
  anchor,
  menuWidth,
  viewportWidth,
  margin = 8
}: PlacementParams): Placement => {
  const maxLeft = Math.max(margin, viewportWidth - menuWidth - margin);
  return {
    left: clamp(margin, maxLeft, anchor.right - menuWidth),
    top: anchor.bottom
  };
};
