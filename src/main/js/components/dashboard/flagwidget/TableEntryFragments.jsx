import React from "react";
import {getMultiLangValue} from "../../../helpers/multiLanguage";
import {compose, pure, withHandlers} from "recompose";
import classNames from "classnames";
import App from "ampersand-app";
import f from "lodash/fp";
import Header from "./HeaderFragments";
import ElementCount from "./ElementCountFragments";

const TableEntry = compose(
  pure,
  withHandlers({
    onMouseEnter: ({handleMouseEnter, index}) => () => {
      handleMouseEnter(index);
    },
    handleClick: ({table = {}, flag, langtag}) => (event) => {
      event.preventDefault();
      App.router.navigate(`/${langtag}/tables/${table.id}?filter:flag:${flag}`);
    }
  })
)(
  ({active, onMouseEnter, langtag, selectedLang, table = {}, style, selected, flag, perc}) => {
    const latest = f.get(["annotationCount", "latest"], table);
    const cellUrl = (flag === "comments" && f.isObject(latest))
      ? `/columns/${latest.columnId}/rows/${latest.rowId}`
      : "";

    const href = `/${(flag === "needs-translation") 
      ? selectedLang 
      : langtag}/tables/${table.id}${cellUrl}?filter:flag:${flag}`;

    return (
      <a className={classNames("table-entry",
        {
          active,
          selected
        })}
         href={href}
         style={style}
         onMouseEnter={onMouseEnter}
         draggable={false}
      >
        <div className="label">
          {getMultiLangValue(langtag, table.name, table.displayName)}
        </div>
        <ElementCount n={f.get(["annotationCount", "count"], table)}
                      selected={selected}
                      flag={flag}
                      perc={(((1 - f.getOr(0, ["translationStatus", selectedLang], table)) * 1000) | 0) / 10}
        />
      </a>
    );
  }
);

export {Header, TableEntry};
