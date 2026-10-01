import { describe, expect, it } from "vitest";
import { Attachment, Folder } from "../../../types/grud";
import { toDirentListEntries } from "./direntListEntries";

const folder = (name: string) => ({ name }) as unknown as Folder;
const file = (uuid: string) => ({ uuid }) as unknown as Attachment;

describe("toDirentListEntries", () => {
  const folders = [folder("f1"), folder("f2")];

  it("puts the back entry first, only when requested", () => {
    expect(toDirentListEntries(true, [], [])).toEqual([{ kind: "back" }]);
    expect(toDirentListEntries(false, [], [])).toEqual([]);
  });

  it("lists folders before files", () => {
    const entries = toDirentListEntries(false, folders, [
      { label: null, dirents: [file("a")] }
    ]);
    expect(entries.map(c => c.kind)).toEqual(["dirent", "dirent", "dirent"]);
    expect(entries[2]).toEqual({ kind: "dirent", dirent: file("a") });
  });

  it("adds no header for ungrouped files", () => {
    const entries = toDirentListEntries(
      false,
      [],
      [{ label: null, dirents: [file("a"), file("b")] }]
    );
    expect(entries.some(c => c.kind === "group-header")).toBe(false);
  });

  it("adds a header before each group, including the empty label", () => {
    const entries = toDirentListEntries(false, folders, [
      { label: "", dirents: [file("a")] },
      { label: "PNG", dirents: [file("b"), file("c")] }
    ]);
    expect(
      entries.map(c => (c.kind === "group-header" ? c.label : c.kind))
    ).toEqual(["dirent", "dirent", "", "dirent", "PNG", "dirent", "dirent"]);
  });
});
