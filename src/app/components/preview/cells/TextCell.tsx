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
  const text = value[langtag] || "Leer";

  if (text.length > TEXT_MAX_LENGTH) {
    return (
      <div className="text-cell">
        <span title={text}>{text.slice(0, TEXT_MAX_LENGTH)}...</span>
      </div>
    );
  }

  return (
    <div className={`text-cell ${setEmptyClassName(text)}`}>
      <span>{text}</span>
    </div>
  );
}
