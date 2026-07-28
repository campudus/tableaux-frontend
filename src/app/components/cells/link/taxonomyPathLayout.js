import { prepareWithSegments, measureNaturalWidth } from "@chenglou/pretext";

// TODO: Keep in sync with .taxonomy-path-node/.link-label font styling
const FONT = "13px Roboto";
const SEPARATOR = " > ";
const MIN_FIRST_NODE_WIDTH = 20;
// pretext's canvas-based measurement can drift a few px from the actual
// rendered width; bias toward collapsing rather than risk the browser's own
// text-overflow ellipsis silently clipping the leaf node instead.
const WIDTH_SAFETY_MARGIN = 8;

export const TAXONOMY_ELLIPSIS = "...";

const measure = text => measureNaturalWidth(prepareWithSegments(text, FONT));

// Computes which taxonomy path nodes to show given the available width.
// Collapses middle nodes right-to-left into a single "..." placeholder first;
// if it still doesn't fit once fully collapsed, returns a maxWidth the first
// node should be constrained to so CSS can ellipsis-truncate it further.
export const getTaxonomyPathLayout = (nodes, rawAvailableWidth) => {
  const availableWidth = Number.isFinite(rawAvailableWidth)
    ? rawAvailableWidth - WIDTH_SAFETY_MARGIN
    : rawAvailableWidth;

  if (nodes.length <= 1 || !Number.isFinite(availableWidth)) {
    return { nodes, firstNodeMaxWidth: null };
  }

  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const middle = nodes.slice(1, -1);

  const separatorWidth = measure(SEPARATOR);
  const firstWidth = measure(first);
  const lastWidth = measure(last);
  const ellipsisWidth = measure(TAXONOMY_ELLIPSIS);
  const middleWidths = middle.map(measure);

  for (let shown = middle.length; shown >= 0; shown--) {
    const collapsed = shown < middle.length;
    const nodeCount = 2 + shown + (collapsed ? 1 : 0);
    const middleSum = middleWidths
      .slice(0, shown)
      .reduce((sum, w) => sum + w, 0);
    const restWidth =
      lastWidth +
      middleSum +
      (collapsed ? ellipsisWidth : 0) +
      separatorWidth * (nodeCount - 1);
    const totalWidth = firstWidth + restWidth;

    if (totalWidth <= availableWidth || shown === 0) {
      const displayNodes = collapsed
        ? [first, ...middle.slice(0, shown), TAXONOMY_ELLIPSIS, last]
        : nodes;
      const overflow = totalWidth - availableWidth;
      const firstNodeMaxWidth =
        overflow > 0
          ? Math.max(MIN_FIRST_NODE_WIDTH, firstWidth - overflow)
          : null;
      return { nodes: displayNodes, firstNodeMaxWidth };
    }
  }

  return { nodes, firstNodeMaxWidth: null };
};
