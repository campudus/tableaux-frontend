import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import {branch, compose, mapProps, pure, renderComponent, withHandlers, withStateHandlers} from "recompose";
import {Header, TableEntry} from "./FlagFragments";
import classNames from "classnames";
import {AutoSizer, List} from "react-virtualized";
import {doto} from "../../../helpers/functools";
import Spinner from "../../header/Spinner";
import {Langtags} from "../../../constants/TableauxConstants";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";

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
    <div className={classNames("flag-widget tile", {wide: flag === "needs-translation"})}>
      <Header {...props} />
      <div onMouseLeave={handleMouseLeave}
           style={{width: "100%", height: "100%"}}>
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
    </div>
  );
};

const LoadingFlagWidget = (props) => (
  <div className={classNames("flag-widget tile", {wide: props.flag === "needs-translation"})}>
    <Header {...props} />
    <Spinner isLoading />
  </div>
);

FlagWidget.propTypes = {
  langtag: PropTypes.string.isRequired,
  flag: PropTypes.string.isRequired
};

const enhance = compose(
  pure,
  branch(
    (props) => f.isNil(props.requestedData),
    renderComponent(LoadingFlagWidget)
  ),
  withStateHandlers(
    ({langtag}) => ({
      selectedIdx: -1,
      selectedLang: doto(Langtags,
        f.tail,
        f.filter(hasUserAccessToLanguage),
        f.first,
        f.defaultTo(langtag)
      )
    }),
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
