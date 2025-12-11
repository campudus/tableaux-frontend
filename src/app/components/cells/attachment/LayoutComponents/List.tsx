import { ForwardedRef, forwardRef } from "react";
import { ContextProp, ListProps } from "react-virtuoso";
import { Attachment, Folder } from "../../../../types/grud";

function List(
  {
    style,
    children,
    ...props
  }: ListProps &
    ContextProp<{
      dirents: (Folder | Attachment)[];
      sortable?: boolean;
    }>,
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      {...props}
      ref={ref}
      style={{
        ...style,
        overflow: "auto",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "3px"
      }}
    >
      {children}
    </div>
  );
}

export default forwardRef(List);
