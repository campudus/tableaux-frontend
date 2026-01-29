import { ReactElement, ReactNode } from "react";
import { buildClassName } from "../../helpers/buildClassName";

type ChipProps = {
  className?: string;
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
};

export default function Chip({
  className,
  icon,
  label,
  onClick,
  isActive = false
}: ChipProps): ReactElement {
  return (
    <div
      className={buildClassName(
        "chip",
        { active: isActive, clickable: onClick },
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {icon && <span className="chip__icon">{icon}</span>}
      <span className="chip__label">{label}</span>
    </div>
  );
}
