import React, { useState, KeyboardEventHandler } from "react";
import CurrencyItem from "./CurrencyItem";
import * as f from "lodash/fp";
import { canUserChangeCountryTypeCell } from "../../../helpers/accessManagementHelper";
import { isLocked } from "../../../helpers/annotationHelper";
import askForSessionUnlock from "../../helperComponents/SessionUnlockDialog";
import {
  Cell,
  CurrencyCellValue,
  CurrencyColumn,
  Country,
  Locale,
  GRUDStore
} from "../../../types/grud";
import { useSelector } from "react-redux";

type Props = {
  actions: Record<string, (..._: unknown[]) => void>;
  langtag: string;
  cell: Omit<Cell, "column" | "value"> & {
    column: CurrencyColumn & { countryCodes: Array<Country> };
    value: CurrencyCellValue;
  };
  children: React.ReactChildren;
  funcs: Record<string, (..._: unknown[]) => void>;
  thisUserCantEdit: boolean;
};
const CurrencyView = ({
  actions,
  langtag,
  cell,
  children,
  funcs,
  thisUserCantEdit
}: Props) => {
  const value: CurrencyCellValue = useSelector((store: GRUDStore) => {
    const row = store.rows[cell.table.id]?.data.find(r => r.id === cell.row.id);
    const idx = row?.cells.findIndex(c => c.id === cell.id);
    return f.isNil(idx) || f.isNil(row)
      ? cell.value
      : (row?.values[idx] as CurrencyCellValue);
  });
  const {
    column: { countryCodes },
    row
  } = cell;
  const [activeCountry, setActiveCountry] = useState<Country>();
  const handleChange = (country: string) => (value: number | null) => {
    const newValue = { ...cell.value, [country]: value };
    actions.changeCellValue?.({ cell, oldValue: cell.value, newValue });
    setActiveCountry(undefined);
  };

  const handleKeyDown: KeyboardEventHandler = evt => {
    f.cond([
      [
        (key: KeyboardEvent["key"]) => key === "tab" && !!activeCountry,
        () => {
          evt.stopPropagation();
          evt.preventDefault();
        }
      ],
      [
        f.eq("enter"),
        () => {
          if (isLocked(row)) {
            askForSessionUnlock(row);
            return;
          }
          if (activeCountry) {
            setActiveCountry(countryCodes[0]);
          }
          evt.stopPropagation();
          evt.preventDefault();
        }
      ]
    ])(evt.key);
  };

  const isDisabled = thisUserCantEdit || isLocked(row);
  const handleSetActiveCountry = (country: Country) => () => {
    if (!isDisabled && canUserChangeCountryTypeCell(cell)(country)) {
      setActiveCountry(country);
    }
  };

  return (
    <div>
      <div
        className="item-content currency"
        ref={el => {
          funcs.register?.(el);
        }}
        tabIndex={1}
        onKeyDown={handleKeyDown}
      >
        {countryCodes.map(kc => (
          <CurrencyItem
            key={kc}
            langtag={langtag as Locale}
            cell={{ ...cell, value }}
            editing={kc === activeCountry}
            onChange={handleChange(kc)}
            isDisabled={isDisabled || !canUserChangeCountryTypeCell(cell)(kc)}
            countryCode={kc}
            setActive={handleSetActiveCountry(kc)}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default CurrencyView;
