import { Fragment, ReactElement, ReactNode, createElement } from "react";

// The only tag a link column's formatPattern may render as markup.
//
// The pattern is parsed into React elements instead of being sanitised and
// handed to innerHTML: anything that is not a bare <em> -- any other tag, an
// <em> carrying attributes, malformed markup -- stays literal text, which React
// escapes on render. A formatPattern therefore cannot inject markup by
// construction, and there is no dangerouslySetInnerHTML anywhere in this path.
const TAG_PATTERN = /<(\/?)(em)>/gi;

type LabelNode = string | { tag: string; children: LabelNode[] };

type TreeNode = { tag?: string; children: LabelNode[] };

export const parseFormattedLabel = (text: string): LabelNode[] => {
  const root: TreeNode = { children: [] };
  const stack: TreeNode[] = [root];
  const current = () => stack[stack.length - 1]!;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TAG_PATTERN.lastIndex = 0;

  while ((match = TAG_PATTERN.exec(text)) !== null) {
    const [raw, closing, tagName] = match;
    const before = text.slice(lastIndex, match.index);
    if (before) {
      current().children.push(before);
    }

    const tag = (tagName ?? "").toLowerCase();
    if (closing) {
      // Only an end tag matching the innermost open one closes it; a stray or
      // mismatched one is content, not structure.
      if (stack.length > 1 && current().tag === tag) {
        stack.pop();
      } else {
        current().children.push(raw);
      }
    } else {
      const node: TreeNode = { tag, children: [] };
      current().children.push(node as LabelNode);
      stack.push(node);
    }

    lastIndex = match.index + raw.length;
  }

  const rest = text.slice(lastIndex);
  if (rest) {
    current().children.push(rest);
  }

  return pruneEmptyEmphasis(root.children);
};

const textContentOf = (nodes: LabelNode[]): string =>
  nodes
    .map(node =>
      typeof node === "string" ? node : textContentOf(node.children)
    )
    .join("");

// An `em` renders as a padded, filled badge, so one with nothing in it would
// show up as a stray coloured box -- which is what a formatPattern produces
// whenever the attribute it wraps has no value, e.g. an unset boolean.
// Whitespace counts as empty here: a badge around a single space is just as
// much of an artefact as a completely empty one.
const pruneEmptyEmphasis = (nodes: LabelNode[]): LabelNode[] =>
  nodes.reduce<LabelNode[]>((kept, node) => {
    if (typeof node === "string") {
      return [...kept, node];
    }

    const children = pruneEmptyEmphasis(node.children);
    return textContentOf(children).trim()
      ? [...kept, { ...node, children }]
      : kept;
  }, []);

// Plain-text form, for every context that does not render the markup: title
// attributes, tooltips, search and sorting, and all display values outside the
// link cell, the link overlay and the history diff. Takes a missing value so
// callers can hand it a display value straight from the store.
export const stripFormattingTags = (text?: string | null): string =>
  (text ?? "").replace(TAG_PATTERN, "");

const renderNodes = (nodes: LabelNode[]): ReactNode[] =>
  nodes.map((node, idx) =>
    typeof node === "string"
      ? node
      : createElement(
          node.tag,
          {
            key: idx,
            // The class carries the whole appearance: the compass reset in
            // main.scss applies `font: inherit` to em, so it has no browser
            // default left to fall back on.
            className: `formatted-label__${node.tag}`
          },
          ...renderNodes(node.children)
        )
  );

type FormattedLabelProps = {
  // Anything other than a string is passed through untouched -- callers hand
  // us React elements for empty or permission-denied placeholders.
  text?: ReactNode;
};

export default function FormattedLabel({
  text
}: FormattedLabelProps): ReactElement {
  return (
    <Fragment>
      {typeof text === "string" ? renderNodes(parseFormattedLabel(text)) : text}
    </Fragment>
  );
}
