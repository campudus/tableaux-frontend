import { measureText as measure } from "./measureText";

const SEPARATOR = " > ";
const MIN_FIRST_NODE_WIDTH = 20;
// pretext's canvas-based measurement can drift a few px from the actual
// rendered width; bias toward collapsing rather than risk the browser's own
// text-overflow ellipsis silently clipping the leaf node instead.
const WIDTH_SAFETY_MARGIN = 8;

export const TAXONOMY_ELLIPSIS = "...";

// Computes which taxonomy path nodes to show given the available width.
// Collapses middle nodes right-to-left into a single "..." placeholder first;
// if it still doesn't fit once fully collapsed, shrinks the first node via a
// maxWidth so CSS can ellipsis-truncate it further, unless that would shrink
// it below a readable minimum, in which case the first node collapses too.
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
  const middleWidths = middle.map(text => measure(text));

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

      if (overflow <= 0) {
        return { nodes: displayNodes, firstNodeMaxWidth: null };
      }

      const shrunkFirstWidth = firstWidth - overflow;
      if (shrunkFirstWidth < MIN_FIRST_NODE_WIDTH) {
        return {
          nodes: [TAXONOMY_ELLIPSIS, last],
          firstNodeMaxWidth: null
        };
      }

      return { nodes: displayNodes, firstNodeMaxWidth: shrunkFirstWidth };
    }
  }

  return { nodes, firstNodeMaxWidth: null };
};
