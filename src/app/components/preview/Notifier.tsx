import { ReactElement, ReactNode } from "react";
import { buildClassName } from "../../helpers/buildClassName";

type NotifierProps = {
  className?: string;
  icon?: ReactNode;
  label: string;
  button?: ReactNode;
  color?: "dark" | "orange";
};

export default function Notifier({
  className,
  icon,
  label,
  button,
  color = "dark"
}: NotifierProps): ReactElement {
  return (
    <div className={buildClassName("notifier", { [color]: true }, className)}>
      {icon && <div className="notifier__icon">{icon}</div>}
      <div className="notifier__label">{label}</div>
      {button && <div className="notifier__button">{button}</div>}
    </div>
  );
}
