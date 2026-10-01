import { describe, expect, it, vi } from "vitest";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Attachment } from "../../../types/grud";
import AttachmentDirents from "./AttachmentDirents";

vi.mock("react-virtualized", () => ({
  AutoSizer: ({
    children
  }: {
    children: (size: { height: number; width: number }) => JSX.Element;
  }) => children({ height: 1000, width: 1000 })
}));

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => JSX.Element;
  }) => (
    <div>
      {data.map((item, index) => (
        <div key={index} data-testid="entry">
          {itemContent(index, item)}
        </div>
      ))}
    </div>
  ),
  VirtuosoGrid: () => null
}));

vi.mock("./AttachmentDirent", () => ({
  default: ({ dirent }: { dirent: { uuid: string } }) => (
    <span className="file">{dirent.uuid}</span>
  )
}));

const file = (uuid: string) => ({ uuid }) as unknown as Attachment;

const render = (props: Partial<Parameters<typeof AttachmentDirents>[0]>) => {
  const container = document.createElement("div");
  act(() => {
    ReactDOM.render(
      <AttachmentDirents
        langtag="de"
        layout="list"
        onNavigate={() => undefined}
        {...props}
      />,
      container
    );
  });
  return container;
};

const entryTexts = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-testid=entry]")].map(
    entry => entry.textContent
  );

describe("AttachmentDirents", () => {
  it("renders plain files in order without separators", () => {
    const container = render({ files: [file("b"), file("a")] });
    expect(entryTexts(container)).toEqual(["b", "a"]);
    expect(container.querySelector(".folder-dirent-group-header")).toBeNull();
  });

  it("renders a non-clickable separator before each labelled group", () => {
    const container = render({
      fileGroups: [
        { label: "JPG", dirents: [file("a")] },
        { label: "PNG", dirents: [file("b")] }
      ]
    });
    expect(entryTexts(container)).toEqual(["JPG", "a", "PNG", "b"]);
    expect(
      container.querySelectorAll(".folder-dirent-group-header button")
    ).toHaveLength(0);
  });
});
