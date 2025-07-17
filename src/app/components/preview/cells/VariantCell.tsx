import { ReactElement, useState } from "react";
import f from "lodash/fp";
import { Link } from "react-router-dom";

type VariantCellProps = {
  langtag: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: Record<string, any>[];
  link: string;
};

const MAX_VARIANT_LENGTH = 5;

export default function VariantCell({
  langtag,
  values,
  link
}: VariantCellProps): ReactElement {
  const [showAll, setShowAll] = useState(false);

  if (f.isEmpty(values)) {
    return <span className="variant-cell empty">Leer</span>;
  }

  function addIndexNumber(index: number): string {
    return index >= 10 ? index.toString() : `0${index}`;
  }

  const shouldShowButton = values.length > MAX_VARIANT_LENGTH;
  const displayedValues = showAll
    ? values
    : values.slice(0, MAX_VARIANT_LENGTH);

  return (
    <div className="variant-cell">
      <Link className="variant-cell__link" to={link}>
        {displayedValues.map((value, index) => (
          <div key={value[langtag]}>
            {addIndexNumber(index + 1)}. &nbsp;{value[langtag]}
          </div>
        ))}
      </Link>

      {shouldShowButton && (
        <button
          className="variant-cell__toggle"
          onClick={() => setShowAll(prev => !prev)}
        >
          <i
            className={`fa ${showAll ? "fa-chevron-up" : "fa-chevron-down"}`}
          />
          <span>{showAll ? "Weniger anzeigen" : "Alle anzeigen"}</span>
        </button>
      )}
    </div>
  );
}
