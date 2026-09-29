import { describe, expect, it } from "vitest";
import { Attachment, Folder } from "../../../types/grud";
import { toListCells } from "./direntCells";

const folder = (name: string) => (({ name } as unknown) as Folder);
const file = (uuid: string) => (({ uuid } as unknown) as Attachment);

describe("toListCells", () => {
  const folders = [folder("f1"), folder("f2")];

  it("puts the back cell first, only when requested", () => {
    expect(toListCells(true, [], [])).toEqual([{ kind: "back" }]);
    expect(toListCells(false, [], [])).toEqual([]);
  });

  it("lists folders before files", () => {
    const cells = toListCells(false, folders, [
      { label: null, dirents: [file("a")] }
    ]);
    expect(cells.map(c => c.kind)).toEqual(["dirent", "dirent", "dirent"]);
    expect(cells[2]).toEqual({ kind: "dirent", dirent: file("a") });
  });

  it("adds no header for ungrouped files", () => {
    const cells = toListCells(
      false,
      [],
      [{ label: null, dirents: [file("a"), file("b")] }]
    );
    expect(cells.some(c => c.kind === "group-header")).toBe(false);
  });

  it("adds a header before each group, including the empty label", () => {
    const cells = toListCells(false, folders, [
      { label: "", dirents: [file("a")] },
      { label: "PNG", dirents: [file("b"), file("c")] }
    ]);
    expect(
      cells.map(c => (c.kind === "group-header" ? c.label : c.kind))
    ).toEqual(["dirent", "dirent", "", "dirent", "PNG", "dirent", "dirent"]);
  });
});
