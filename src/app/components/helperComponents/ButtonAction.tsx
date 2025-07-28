import { Portal } from "react-portal";
import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { buildClassName as cn } from "../../helpers/buildClassName";
import { outsideClickEffect } from "../../helpers/useOutsideClick";

type ButtonActionOption = {
  className?: string;
  icon?: ReactNode;
  label?: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

type ButtonActionProps = {
  className?: string;
  variant?: "link" | "icon" | "text" | "contained" | "outlined";
  icon?: ReactNode;
  label?: ReactNode;
  alt?: string;
  disabled?: boolean;
  alignmentH?: "left" | "right";
} & (
  | { options: ButtonActionOption[]; onClick?: never }
  | {
      options?: never;
      onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    }
);

export default function ButtonAction({
  className,
  variant = "text",
  icon,
  label,
  alt,
  options,
  onClick,
  disabled,
  alignmentH = "right"
}: ButtonActionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { left, right, bottom } =
    buttonRef.current?.getBoundingClientRect() ?? {};
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const style =
    alignmentH === "right"
      ? { left: left, top: bottom }
      : { right: `calc(100% - ${right}px)`, top: bottom };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick?.(event);
    } else {
      setShowMenu(isOpen => !isOpen);
    }
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  useEffect(
    outsideClickEffect({
      shouldListen: showMenu,
      containerRef: menuRef,
      onOutsideClick: handleCloseMenu
    }),
    [showMenu, menuRef.current]
  );

  return (
    <div className={cn("button-action", {}, className)}>
      <button
        ref={buttonRef}
        className={cn("button-action__button", {
          [variant]: true,
          active: showMenu
        })}
        onClick={handleClick}
        title={alt}
        disabled={disabled}
      >
        {icon}
        {label}
      </button>

      {showMenu && options && (
        <Portal>
          <div ref={menuRef} style={style} className="button-action__menu">
            {options.map(option => (
              <ButtonAction
                key={option.label?.toString()}
                className={option.className}
                label={option.label}
                icon={option.icon}
                onClick={event => {
                  option.onClick(event);
                  handleCloseMenu();
                }}
              />
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
