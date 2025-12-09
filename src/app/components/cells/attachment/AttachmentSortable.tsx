import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CSSProperties, PropsWithChildren } from "react";
import { Layout } from "./AttachmentOverlay";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import SvgIcon from "../../helperComponents/SvgIcon";

type AttachmentSortableProps = PropsWithChildren<{
  id: UniqueIdentifier;
  layout: Layout;
  style?: CSSProperties;
}>;

export default function AttachmentSortable({
  id,
  style,
  layout,
  children,
  ...props
}: AttachmentSortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const sortableStyle = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 999 } : {})
  };

  return (
    <div
      {...props}
      ref={setNodeRef}
      className={cn("attachment-sortable", { [layout]: true })}
      style={sortableStyle}
      {...attributes}
    >
      <div className="drag-handle" {...listeners}>
        <SvgIcon icon="burger"></SvgIcon>
      </div>
      {children}
    </div>
  );
}
