import React from "react";
import { buildClassName } from "../../helpers/buildClassName";

export default function AnnotationBadge({
  className,
  title,
  onClick,
  active,
  color,
  testId
}) {
  const style = active
    ? { color: "white", borderColor: color, background: color }
    : { color, borderColor: color, background: "white" };

  return (
    <button
      className={buildClassName("annotation-badge", { active }, className)}
      onClick={onClick}
      style={style}
      data-testid={testId}
    >
      {title}
    </button>
  );
}
