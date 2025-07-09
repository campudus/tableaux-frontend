import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";

type FolderActionOption = {
  icon?: ReactNode;
  label?: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

type FolderActionProps = {
  className?: string;
  variant?: "text" | "contained" | "outlined";
  icon?: ReactNode;
  label?: ReactNode;
} & (
  | { options: FolderActionOption[]; onClick?: never }
  | { options?: never; onClick: (event: MouseEvent<HTMLButtonElement>) => void }
);

export default function FolderAction({
  className,
  variant = "text",
  icon,
  label,
  options,
  onClick
}: FolderActionProps) {
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
        className={cn("folder-action__button", {
          [variant]: true,
          active: showMenu
        })}
        onClick={handleClick}
      >
        {icon}
        {label}
      </button>

      {showMenu && options && (
        <div ref={menuRef} className="folder-action__menu">
          {options.map(option => (
            <FolderAction
              key={option.label?.toString()}
              label={option.label}
              icon={option.icon}
              onClick={event => {
                option.onClick(event);
                handleCloseMenu();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
