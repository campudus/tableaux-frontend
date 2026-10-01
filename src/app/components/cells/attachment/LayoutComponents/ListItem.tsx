import { ContextProp, ItemProps } from "react-virtuoso";
import { DirentListEntry } from "../../../media/folder/direntListEntries";
import { isAttachment } from "../../../../types/guards";
import AttachmentSortable from "../AttachmentSortable";
import { Layout } from "../AttachmentOverlay";

export default function ListItem({
  children,
  context,
  ...props
}: ItemProps<DirentListEntry> &
  ContextProp<{
    entries: DirentListEntry[];
    sortable?: boolean;
  }>) {
  const index = props["data-item-index"];
  const entry = context.entries[index];
  const layout: Layout = "list";
  const style = { height: "48px" };

  if (!entry) return null;

  if (entry.kind !== "dirent") {
    return (
      <div {...props} key={entry.kind} style={style}>
        {children}
      </div>
    );
  }

  const { dirent } = entry;
  const id = isAttachment(dirent) ? dirent.uuid : dirent.id;

  return context.sortable ? (
    <AttachmentSortable
      {...props}
      key={id}
      id={id}
      layout={layout}
      style={style}
    >
      {children}
    </AttachmentSortable>
  ) : (
    <div {...props} key={id} style={style}>
      {children}
    </div>
  );
}
