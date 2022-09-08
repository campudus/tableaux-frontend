import React from "react";
import { buildClassName } from "../../helpers/buildClassName";

export const Button = ({
  onClick,
  disabled,
  classNames,
  children,
  text,
  alt
}) => (
  <button
    className={`${buildClassName("button", { disabled })} ${classNames || ""}`}
    onClick={onClick}
    disabled={!!disabled}
    title={alt}
  >
    {text || children}
  </button>
);

Button.displayName = "Button";
export default Button;
