import React from "react";
import { buildClassName } from "../../helpers/buildClassName";
import Spinner from "../header/Spinner";

export const Button = ({
  onClick,
  disabled,
  classNames,
  children,
  text,
  alt,
  waiting
}) => {
  const content = text ? (
    <span className="button__text">{text}</span>
  ) : (
    children
  );

  const handleClick = waiting ? () => null : onClick;

  return (
    <button
      className={`${buildClassName("button", {
        disabled,
        waiting
      })} ${classNames || ""}`}
      onClick={handleClick}
      disabled={!!disabled}
      title={alt}
    >
      <div className="button__spinner">
        <Spinner isLoading={waiting} />
      </div>
      {content}
    </button>
  );
};

Button.displayName = "Button";
export default Button;
