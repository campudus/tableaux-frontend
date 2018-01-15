import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import {compose, mapProps, pure, withHandlers, withStateHandlers} from "recompose";
import {Header, TableEntry} from "./FlagFragments";
import classNames from "classnames";
import {AutoSizer, List} from "react-virtualized";
import {doto} from "../../../helpers/functools";

const pickTables = (props) => {
  const {selectedLang, flag, requestedData} = props;
  const tables = (flag === "needs-translation")
    ? doto(requestedData,
      f.getOr([], [selectedLang, "tables"]),
      f.filter((table) => f.getOr(0, "events", table) > 0)
    )
    : requestedData.tables;
  return f.assoc("tables", tables, props);
};

const sortEntries = (props) => {
  return f.update(
    "tables",
    f.sortBy((table) => Number.MAX_SAFE_INTEGER - f.getOr(0, "events", table)), // reverse in one step
    props
  );
};

const FlagWidget = (props) => {
  const {flag, selectedIdx, tables, mkTableEntry, handleMouseLeave, langtag, selectedLang} = props;

  return (
    <div className={classNames("flag-widget tile", {wide: flag === "needs-translation"})}
         onMouseLeave={handleMouseLeave}
    >
      <Header {...props} />
      <AutoSizer>
        {({width, height}) => (
          <List width={width}
                height={height}
                scrollToIndex={selectedIdx}
                rowRenderer={mkTableEntry}
                rowCount={f.size(tables)}
                rowHeight={25}
                stateString={langtag + selectedLang + ":" + selectedIdx}
          />
        )}
      </AutoSizer>
    </div>
  );
};

FlagWidget.propTypes = {
  langtag: PropTypes.string.isRequired,
  flag: PropTypes.string.isRequired
};

const enhance = compose(
  pure,
  withStateHandlers(
    ({langtag}) => ({selectedIdx: -1, selectedLang: langtag}),
    {
      handleMouseLeave: () => () => ({selectedIdx: -1}),
      setSelection: () => (index) => ({selectedIdx: index}),
      setLangtag: () => (langtag) => ({selectedLang: langtag})
    }
  ),
  mapProps(pickTables),
  mapProps(sortEntries),
  withHandlers({
    mkTableEntry: ({selectedIdx, flag, tables, setSelection, langtag, selectedLang}) => ({index, style}) => {
      const table = f.getOr({}, index, tables);
      return (
        <TableEntry key={f.get("id", table)}
                    style={style}
                    table={table}
                    index={index}
                    selected={selectedIdx === index}
                    active={selectedIdx >= 0}
                    handleMouseEnter={setSelection}
                    flag={flag}
                    langtag={langtag}
                    selectedLang={selectedLang}
        />
      );
    }
  })
);

export default enhance(FlagWidget);
