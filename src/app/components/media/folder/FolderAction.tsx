import { Portal } from "react-portal";
import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";

type FolderActionOption = {
  className?: string;
  icon?: ReactNode;
  label?: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

type FolderActionProps = {
  className?: string;
  variant?: "link" | "icon" | "text" | "contained" | "outlined";
  icon?: ReactNode;
  label?: ReactNode;
  alt?: string;
} & (
  | { options: FolderActionOption[]; onClick?: never }
  | { options?: never; onClick: (event: MouseEvent<HTMLButtonElement>) => void }
);

export default function FolderAction({
  className,
  variant = "text",
  icon,
  label,
  alt,
  options,
  onClick
}: FolderActionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonPosition = buttonRef.current?.getBoundingClientRect();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);

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
    <div className={cn("folder-action", {}, className)}>
      <button
        ref={buttonRef}
        className={cn("folder-action__button", {
          [variant]: true,
          active: showMenu
        })}
        onClick={handleClick}
        title={alt}
      >
        {icon}
        {label}
      </button>

      {showMenu && options && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              left: buttonPosition?.left,
              top: buttonPosition?.bottom
            }}
            className="folder-action__menu"
          >
            {options.map(option => (
              <FolderAction
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
