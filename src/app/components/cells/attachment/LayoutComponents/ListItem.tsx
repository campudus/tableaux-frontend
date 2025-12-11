import { ContextProp, ItemProps } from "react-virtuoso";
import { Attachment, Folder } from "../../../../types/grud";
import { isAttachment } from "../../../../types/guards";
import AttachmentSortable from "../AttachmentSortable";
import { Layout } from "../AttachmentOverlay";

export default function ListItem({
  children,
  context,
  ...props
}: ItemProps<Attachment | Folder> &
  ContextProp<{
    dirents: (Folder | Attachment)[];
    sortable?: boolean;
  }>) {
  const index = props["data-item-index"];
  const dirent = context.dirents[index];
  const layout: Layout = "list";
  const style = { height: "48px" };

  if (!dirent) return null;

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
