import { Fragment, ReactElement, ReactNode, createElement } from "react";

// The only markup a format pattern may contain. Another tag, an <em> carrying
// attributes and a stray end tag stay literal text, which React escapes on
// render. See docs/adr/0002-em-only-markup-parsed-to-react-nodes.md.
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
      // mismatched one is content.
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

// An `em` renders as a filled badge, so an empty one -- what a pattern yields
// when the attribute it wraps has no value -- would be a stray coloured box.
// Whitespace counts as empty.
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

// Plain-text form, for everything that does not render the markup. Takes a
// missing value, so callers can hand it a display value straight from the store.
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
            // main.scss applies `font: inherit` to em, leaving no browser
            // default to fall back on.
            className: `formatted-label__${node.tag}`
          },
          ...renderNodes(node.children)
        )
  );

type FormattedLabelProps = {
  // Passed through untouched unless it is a string: callers hand us React
  // elements for empty or permission-denied placeholders.
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
