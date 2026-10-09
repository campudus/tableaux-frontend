import { ChangeEventHandler } from "react";
import uniqueId from "lodash/fp/uniqueId";
import { buildClassName as cn } from "../../helpers/buildClassName";

type ToggleProps = {
  className?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  testId?: string;
};

export default function Toggle({
  className,
  checked,
  onChange,
  testId
}: ToggleProps) {
  const id = uniqueId("toggle");

  return (
    <label className={cn("toggle", {}, className)} htmlFor={id}>
      <input
        id={id}
        className="toggle__input"
        type="checkbox"
        checked={checked ?? false}
        onChange={onChange}
        data-testid={testId}
      />
      <div className="toggle__fill"></div>
    </label>
  );
}
