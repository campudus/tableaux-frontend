import { ReactElement } from "react";

const PX_PER_CHAR = 7.3;

type LabelTruncatedProps = {
  width: number;
  label: string;
  fixedCharLimit?: number;
  reservedSpace?: number;
};

/**
 * truncates label but leaves some chars at the end
 * @example veryLongFileName.jpg -> veryLong...Name.jpg
 * @returns string
 */
export default function LabelTruncated({
  width,
  label,
  fixedCharLimit,
  reservedSpace = 0
}: LabelTruncatedProps): ReactElement {
  let charLimit;

  if (fixedCharLimit) {
    charLimit = fixedCharLimit;
  } else {
    charLimit = Math.floor((width - reservedSpace) / PX_PER_CHAR);
  }

  if (label.length <= charLimit) {
    return <>{label}</>;
  }

  const labelStart = label.slice(0, charLimit - 10);
  const labelEnd = label.slice(-8);

  return <>{`${labelStart}...${labelEnd}`}</>;
}
