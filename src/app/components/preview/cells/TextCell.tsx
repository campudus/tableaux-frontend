import { ReactElement } from "react";
import { getEmptyClassName } from "../helper";
import i18n from "i18next";

type TextCellProps = {
  langtag: string;
  multilangValue: Record<string, string>;
};

const TEXT_MAX_LENGTH = 250;

export default function TextCell({
  langtag,
  multilangValue
}: TextCellProps): ReactElement {
  const value = multilangValue[langtag];

  if (value && value.length > TEXT_MAX_LENGTH) {
    return (
      <span className="text-cell">{value.slice(0, TEXT_MAX_LENGTH)}...</span>
    );
  }

  return (
    <span className={`text-cell ${getEmptyClassName(value)}`}>
      {value || i18n.t("preview:empty")}
    </span>
  );
}
