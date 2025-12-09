import { ContextProp, GridItemProps } from "react-virtuoso";
import { Attachment, Folder } from "../../../../types/grud";
import { isAttachment } from "../../../../types/guards";
import AttachmentSortable from "../AttachmentSortable";
import { Layout } from "../AttachmentOverlay";

export default function GridItem({
  children,
  context,
  ...props
}: GridItemProps &
  ContextProp<{
    dirents: (Folder | Attachment)[];
    sortable?: boolean;
  }>) {
  const index = props["data-index"];
  const dirent = context.dirents[index];
  const layout: Layout = "tiles";
  const style = { height: "130px" };

  if (!dirent) return null;

  const id = isAttachment(dirent) ? dirent.uuid : dirent.id;

  return context.sortable ? (
    <AttachmentSortable {...props} id={id} layout={layout} style={style}>
      {children}
    </AttachmentSortable>
  ) : (
    <div {...props} style={style}>
      {children}
    </div>
  );
}
