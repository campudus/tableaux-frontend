import React from "react";
import { buildClassName } from "../../helpers/buildClassName";

export default function AnnotationDot({ className, color, active }) {
  return (
    <div
      className={buildClassName("annotation-dot", { active }, className)}
      style={{ color }}
    >
      <div className="annotation-dot__inner" />
    </div>
  );
}
