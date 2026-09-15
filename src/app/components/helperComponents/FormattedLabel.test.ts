import { describe, expect, it } from "vitest";
import { parseFormattedLabel, stripFormattingTags } from "./FormattedLabel";

describe("parseFormattedLabel()", () => {
  it("keeps plain text as a single string", () => {
    expect(parseFormattedLabel("Grau 12%")).toEqual(["Grau 12%"]);
  });

  it("renders the one allowed tag", () => {
    expect(parseFormattedLabel("a<em>b</em>c")).toEqual([
      "a",
      { tag: "em", children: ["b"] },
      "c"
    ]);
  });

  it("nests", () => {
    expect(parseFormattedLabel("<em>outer <em>inner</em></em>")).toEqual([
      {
        tag: "em",
        children: ["outer ", { tag: "em", children: ["inner"] }]
      }
    ]);
  });

  it("leaves every other tag as literal text", () => {
    // React escapes these on render, so they show up as text rather than markup
    expect(parseFormattedLabel("<script>alert(1)</script>")).toEqual([
      "<script>alert(1)</script>"
    ]);
    expect(parseFormattedLabel("<b>x</b>")).toEqual(["<b>x</b>"]);
    expect(parseFormattedLabel("<i>x</i>")).toEqual(["<i>x</i>"]);
    expect(parseFormattedLabel("<strong>x</strong>")).toEqual([
      "<strong>x</strong>"
    ]);
    expect(parseFormattedLabel("<div>x</div>")).toEqual(["<div>x</div>"]);
  });

  it("does not accept an em carrying attributes", () => {
    const input = "<em onclick='evil()'>x</em>";
    const nodes = parseFormattedLabel(input);

    // what matters is that no element is created; the text may well be split
    // across several literal segments, which renders identically
    expect(nodes.every(node => typeof node === "string")).toBe(true);
    expect(nodes.join("")).toBe(input);
  });

  it("does not accept an img with an onerror handler", () => {
    const input = "<img src=x onerror='alert(1)'>";
    expect(parseFormattedLabel(input)).toEqual([input]);
  });

  it("treats a stray end tag as content", () => {
    expect(parseFormattedLabel("a</em>b")).toEqual(["a", "</em>", "b"]);
  });

  it("accepts upper case tags and normalises them", () => {
    expect(parseFormattedLabel("<EM>x</EM>")).toEqual([
      { tag: "em", children: ["x"] }
    ]);
  });

  it("handles an unclosed tag", () => {
    expect(parseFormattedLabel("<em>x")).toEqual([
      { tag: "em", children: ["x"] }
    ]);
  });

  it("handles an empty string", () => {
    expect(parseFormattedLabel("")).toEqual([]);
  });
});

// An empty em would render as a stray coloured box -- what a pattern yields
// when the attribute it wraps has no value.
describe("parseFormattedLabel() - empty emphasis", () => {
  it("drops an em with no content", () => {
    expect(parseFormattedLabel("Grau <em></em>")).toEqual(["Grau "]);
  });

  it("drops an em containing only whitespace", () => {
    expect(parseFormattedLabel("Grau <em> </em>")).toEqual(["Grau "]);
  });

  it("drops an unclosed em with no content", () => {
    expect(parseFormattedLabel("Grau <em>")).toEqual(["Grau "]);
  });

  it("keeps an em that has content", () => {
    expect(parseFormattedLabel("Grau <em>12%</em>")).toEqual([
      "Grau ",
      { tag: "em", children: ["12%"] }
    ]);
  });

  it("keeps an em holding the missing-value placeholder", () => {
    expect(parseFormattedLabel("<em>_</em>")).toEqual([
      { tag: "em", children: ["_"] }
    ]);
  });

  it("drops an em whose only child is an empty em", () => {
    expect(parseFormattedLabel("<em><em></em></em>")).toEqual([]);
  });

  it("keeps an em whose content sits in a nested em", () => {
    expect(parseFormattedLabel("<em><em>12%</em></em>")).toEqual([
      { tag: "em", children: [{ tag: "em", children: ["12%"] }] }
    ]);
  });

  it("drops a nested empty em but keeps its parent", () => {
    expect(parseFormattedLabel("<em>Grau <em></em></em>")).toEqual([
      { tag: "em", children: ["Grau "] }
    ]);
  });

  it("keeps an em whose content is a literal, unsupported tag", () => {
    // <b> is text, not structure, so this em is not empty
    expect(parseFormattedLabel("<em><b></b></em>")).toEqual([
      { tag: "em", children: ["<b></b>"] }
    ]);
  });
});

describe("stripFormattingTags()", () => {
  it("removes the em tags and keeps their content", () => {
    expect(stripFormattingTags("Grau <em>12%</em>")).toBe("Grau 12%");
  });

  it("leaves other markup untouched", () => {
    expect(stripFormattingTags("<b>x</b>")).toBe("<b>x</b>");
    expect(stripFormattingTags("<strong>x</strong>")).toBe(
      "<strong>x</strong>"
    );
  });

  // a display value from the store is absent for a langtag with no value
  it("takes a missing value", () => {
    expect(stripFormattingTags(undefined)).toBe("");
    expect(stripFormattingTags(null)).toBe("");
  });
});
