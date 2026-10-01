import { Attachment } from "@grud/devtools/types";
import { describe, expect, it } from "vitest";
import { Folder } from "src/app/types/grud";
import {
  arrangeAttachments,
  DirentGroup,
  DirentOrder,
  nextCriterion,
  sortAttachments,
  sortFolders,
  toggleDirection
} from "./direntOrdering";

type Multilang = Record<string, string>;

const attachment = (
  externalName: Multilang | string,
  mimeType: string
): Attachment =>
  ({
    externalName:
      typeof externalName === "string"
        ? { "de-DE": externalName }
        : externalName,
    mimeType: { "de-DE": mimeType }
  }) as unknown as Attachment;

const folder = (name: string): Folder => ({ name }) as unknown as Folder;

const externalNames = (langtag: string) => (attachments: Array<Attachment>) =>
  attachments.map(a => a.externalName[langtag]);
const germanNames = externalNames("de-DE");
const folderNames = (folders: Array<Folder>) => folders.map(f => f.name);

describe("sortAttachments", () => {
  const attachments = [
    attachment("b.png", "image/png"),
    attachment("c.pdf", "application/pdf"),
    attachment("a.png", "image/png"),
    attachment("a.pdf", "application/pdf")
  ];
  const sort = (
    criterion: "by-name" | "by-type",
    direction: "asc" | "desc",
    input = attachments,
    langtag = "de-DE"
  ) => sortAttachments({ criterion, direction }, langtag, input);

  it("sorts by name ascending", () => {
    expect(germanNames(sort("by-name", "asc"))).toEqual([
      "a.pdf",
      "a.png",
      "b.png",
      "c.pdf"
    ]);
  });

  it("sorts by name descending", () => {
    expect(germanNames(sort("by-name", "desc"))).toEqual([
      "c.pdf",
      "b.png",
      "a.png",
      "a.pdf"
    ]);
  });

  it("sorts by name ignoring case", () => {
    const mixed = [
      attachment("banana.png", "image/png"),
      attachment("Cherry.png", "image/png"),
      attachment("apple.png", "image/png")
    ];
    expect(germanNames(sort("by-name", "asc", mixed))).toEqual([
      "apple.png",
      "banana.png",
      "Cherry.png"
    ]);
  });

  it("sorts by file extension ascending, using the name as tie-breaker", () => {
    expect(germanNames(sort("by-type", "asc"))).toEqual([
      "a.pdf",
      "c.pdf",
      "a.png",
      "b.png"
    ]);
  });

  it("sorts by file extension descending, reversing the tie-breaker too", () => {
    expect(germanNames(sort("by-type", "desc"))).toEqual([
      "b.png",
      "a.png",
      "c.pdf",
      "a.pdf"
    ]);
  });

  it("sorts by file extension rather than by mime type", () => {
    const conflicting = [
      attachment("a.zip", "application/a"),
      attachment("b.abc", "application/z")
    ];
    expect(germanNames(sort("by-type", "asc", conflicting))).toEqual([
      "b.abc",
      "a.zip"
    ]);
  });

  it("sorts file extensions ignoring case", () => {
    const mixed = [
      attachment("a.PNG", "image/png"),
      attachment("b.gif", "image/gif"),
      attachment("c.png", "image/png")
    ];
    expect(germanNames(sort("by-type", "asc", mixed))).toEqual([
      "b.gif",
      "a.PNG",
      "c.png"
    ]);
  });

  describe("files without extension", () => {
    const mixed = [
      attachment("b.png", "image/png"),
      attachment("README", "text/plain"),
      attachment("a.pdf", "application/pdf"),
      attachment("LICENSE", "text/plain"),
      attachment("png", "text/plain")
    ];

    it("groups them before all extensions when ascending, sorted by name", () => {
      expect(germanNames(sort("by-type", "asc", mixed))).toEqual([
        "LICENSE",
        "png",
        "README",
        "a.pdf",
        "b.png"
      ]);
    });

    it("groups them after all extensions when descending, sorted by name descending", () => {
      expect(germanNames(sort("by-type", "desc", mixed))).toEqual([
        "b.png",
        "a.pdf",
        "README",
        "png",
        "LICENSE"
      ]);
    });

    it("does not mistake a name for an extension", () => {
      const named = [attachment("a.png", "image/png"), attachment("png", "x")];
      expect(germanNames(sort("by-type", "asc", named))).toEqual([
        "png",
        "a.png"
      ]);
    });
  });

  it("sorts by file extension of the name in the given langtag", () => {
    const translated = [
      attachment({ "de-DE": "a.zip", "en-GB": "a.abc" }, "text/plain"),
      attachment({ "de-DE": "b.abc", "en-GB": "b.zip" }, "text/plain")
    ];
    expect(
      externalNames("en-GB")(sort("by-type", "asc", translated, "en-GB"))
    ).toEqual(["a.abc", "b.zip"]);
  });

  it("does not mutate the input", () => {
    const input = [...attachments];
    sort("by-name", "asc", input);
    expect(input).toEqual(attachments);
  });

  it("returns an empty list for empty input", () => {
    expect(sort("by-type", "asc", [])).toEqual([]);
  });

  describe("with translated names", () => {
    const translated = [
      attachment({ "de-DE": "Apfel", "en-GB": "Zebra" }, "text/plain"),
      attachment({ "de-DE": "Zitrone", "en-GB": "Apple" }, "text/plain")
    ];

    it("sorts by the name in the given langtag", () => {
      expect(
        externalNames("de-DE")(sort("by-name", "asc", translated, "de-DE"))
      ).toEqual(["Apfel", "Zitrone"]);
      expect(
        externalNames("en-GB")(sort("by-name", "asc", translated, "en-GB"))
      ).toEqual(["Apple", "Zebra"]);
    });

    it("falls back to the default language for missing translations", () => {
      const partial = [
        attachment({ "de-DE": "Zitrone" }, "text/plain"),
        attachment({ "de-DE": "Apfel", "en-GB": "Zzz" }, "text/plain"),
        attachment({ "de-DE": "Mango", "en-GB": "Mango" }, "text/plain")
      ];
      expect(
        externalNames("de-DE")(sort("by-name", "asc", partial, "en-GB"))
      ).toEqual(["Mango", "Zitrone", "Apfel"]);
    });

    it("sorts attachments without any name first when ascending", () => {
      const withGap = [
        attachment("b", "text/plain"),
        attachment({}, "text/plain")
      ];
      expect(germanNames(sort("by-name", "asc", withGap))).toEqual([
        undefined,
        "b"
      ]);
    });
  });
});

describe("sortFolders", () => {
  const folders = [folder("Zebra"), folder("Apple"), folder("Mango")];

  it("sorts by name ascending", () => {
    const result = sortFolders(
      { criterion: "by-name", direction: "asc" },
      folders
    );
    expect(folderNames(result)).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("sorts by name descending", () => {
    const result = sortFolders(
      { criterion: "by-name", direction: "desc" },
      folders
    );
    expect(folderNames(result)).toEqual(["Zebra", "Mango", "Apple"]);
  });

  it("sorts by name when the criterion is by-type, as folders have no type", () => {
    const byType = sortFolders(
      { criterion: "by-type", direction: "asc" },
      folders
    );
    const byName = sortFolders(
      { criterion: "by-name", direction: "asc" },
      folders
    );
    expect(folderNames(byType)).toEqual(folderNames(byName));
  });

  it("does not mutate the input", () => {
    const input = [...folders];
    sortFolders({ criterion: "by-name", direction: "desc" }, input);
    expect(input).toEqual(folders);
  });

  it("returns an empty list for empty input", () => {
    expect(sortFolders({ criterion: "by-name", direction: "asc" }, [])).toEqual(
      []
    );
  });
});

describe("arrangeAttachments", () => {
  const arrange = (
    criterion: "by-name" | "by-type",
    direction: "asc" | "desc",
    names: Array<string>
  ) =>
    arrangeAttachments(
      { criterion, direction },
      "de-DE",
      names.map(name => attachment(name, "x"))
    );
  const summary = (groups: Array<DirentGroup<Attachment>>) =>
    groups.map(g => [g.label, germanNames(g.dirents)]);
  const names = ["b.png", "README", "a.PDF", "c.png", "a.pdf"];

  it("does not group when sorting by name", () => {
    expect(summary(arrange("by-name", "asc", names))).toEqual([
      [null, ["a.PDF", "a.pdf", "b.png", "c.png", "README"]]
    ]);
  });

  it("groups by extension ignoring case when sorting by type", () => {
    expect(summary(arrange("by-type", "asc", names))).toEqual([
      ["", ["README"]],
      ["PDF", ["a.PDF", "a.pdf"]],
      ["PNG", ["b.png", "c.png"]]
    ]);
  });

  it("reverses group and member order when descending", () => {
    expect(summary(arrange("by-type", "desc", names))).toEqual([
      ["PNG", ["c.png", "b.png"]],
      ["PDF", ["a.PDF", "a.pdf"]],
      ["", ["README"]]
    ]);
  });

  it("keeps group order for numeric extensions", () => {
    expect(
      summary(arrange("by-type", "asc", ["a.10", "a.9", "b.10"])).map(g => g[0])
    ).toEqual(["10", "9"]);
  });

  it("returns no groups for empty input", () => {
    expect(arrange("by-name", "asc", [])).toEqual([]);
    expect(arrange("by-type", "asc", [])).toEqual([]);
  });
});

describe("nextCriterion", () => {
  it("cycles name, type, date and back to name", () => {
    const byName: DirentOrder = { criterion: "by-name", direction: "asc" };
    const byType = nextCriterion(byName);
    const byDate = nextCriterion(byType);
    const backToName = nextCriterion(byDate);
    expect([byName, byType, byDate, backToName].map(o => o.criterion)).toEqual([
      "by-name",
      "by-type",
      "by-date",
      "by-name"
    ]);
  });

  it("keeps the direction and does not mutate its input", () => {
    const order: DirentOrder = { criterion: "by-type", direction: "desc" };
    expect(nextCriterion(order)).toEqual({
      criterion: "by-date",
      direction: "desc"
    });
    expect(order).toEqual({ criterion: "by-type", direction: "desc" });
  });
});

describe("toggleDirection", () => {
  it("flips the direction, keeps the criterion and does not mutate", () => {
    const order: DirentOrder = { criterion: "by-date", direction: "asc" };
    expect(toggleDirection(order)).toEqual({
      criterion: "by-date",
      direction: "desc"
    });
    expect(toggleDirection(toggleDirection(order))).toEqual(order);
    expect(order.direction).toBe("asc");
  });
});
