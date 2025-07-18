import { ReactElement } from "react";
import { setEmptyClassName } from "../helper";

type TextCellProps = {
  langtag: string;
  value: Record<string, string>;
};

const TEXT_MAX_LENGTH = 250;

export default function TextCell({
  langtag,
  value
}: TextCellProps): ReactElement {
  const _value = value[langtag];

  if (_value && _value.length > TEXT_MAX_LENGTH) {
    return (
      <span className="text-cell">{_value.slice(0, TEXT_MAX_LENGTH)}...</span>
    );
  }

  return (
    <span className={`text-cell ${setEmptyClassName(_value)}`}>
      {_value || "Leer"}
    </span>
  );
}
