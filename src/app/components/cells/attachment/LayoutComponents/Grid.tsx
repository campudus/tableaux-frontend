import { ForwardedRef, forwardRef } from "react";
import { GridListProps } from "react-virtuoso";

function Grid(
  { style, children, ...props }: GridListProps,
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
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "6px"
      }}
    >
      {children}
    </div>
  );
}

export default forwardRef(Grid);
