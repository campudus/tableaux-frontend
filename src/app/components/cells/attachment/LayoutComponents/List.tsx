import { ForwardedRef, forwardRef } from "react";
import { ContextProp, ListProps } from "react-virtuoso";
import { DirentListEntry } from "../../../media/folder/direntListEntries";

function List(
  {
    style,
    children,
    ...props
  }: ListProps &
    ContextProp<{
      entries: DirentListEntry[];
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
