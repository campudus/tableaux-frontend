import { ChangeEventHandler } from "react";
import uniqueId from "lodash/fp/uniqueId";
import { buildClassName as cn } from "../../helpers/buildClassName";

type ToggleProps = {
  className?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export default function Toggle({ className, checked, onChange }: ToggleProps) {
  const id = uniqueId("toggle");

  return (
    <label className={cn("toggle", {}, className)} htmlFor={id}>
      <input
        id={id}
        className="toggle__input"
        type="checkbox"
        checked={checked ?? false}
        onChange={onChange}
      />
      <div className="toggle__fill"></div>
    </label>
  );
}
