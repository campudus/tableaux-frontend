import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import { Header, TableEntry } from "./TableEntryFragments";
import classNames from "classnames";
import { AutoSizer, List } from "react-virtualized";
import { doto } from "../../../helpers/functools";
import Spinner from "../../header/Spinner";
import { Langtags } from "../../../constants/TableauxConstants";
import { hasUserAccessToLanguage } from "../../../helpers/accessManagementHelper";

const getFirstEditableLang = langtag =>
  doto(
    Langtags,
    f.tail, // this line prevents primary lang from being selected
    f.filter(hasUserAccessToLanguage),
    f.first,
    f.defaultTo(langtag)
  );

const pickTables = props => {
  const { selectedLang, flag, requestedData } = props;

  const pickComments = f.flow(
    f.get("type"),
    f.contains(f, ["info", "warning", "error"])
  );
  const pickTranslation = f.flow(
    f.props(["value", "langtag"]),
    ([value, langtag]) =>
      value === "needs_translation" &&
      (selectedLang === f.first(Langtags) || langtag === selectedLang)
  );
  const pickByFlag = f.matchesProperty("value", flag);

  const selector = f.cond([
    [f.eq("comments"), f.always(pickComments)],
    [f.eq("needs_translation"), f.always(pickTranslation)],
    [f.stubTrue, f.always(pickByFlag)]
  ])(flag);

  const tables = doto(
    requestedData,
    f.get("tables"),
    f.map(f.update("annotationCount", f.flow(f.filter(selector), f.first))),
    f.filter(f.flow(f.get(["annotationCount", "count"]), f.lt(0)))
  );

  return f.assoc("tables", tables, props);
};

const sortEntries = props => {
  const latestObjOrFallback = f.flow(
    f.props([
      ["annotationCount", "latest", "createdAt"],
      ["annotationCount", "lastCreatedAt"]
    ]),
    f.find(f.identity)
  );

  return f.update(
    "tables",
    props.flag === "comments"
      ? f.flow(f.sortBy(latestObjOrFallback), f.reverse)
      : f.sortBy(table => -f.getOr(0, ["annotationCount", "count"], table)), // reverse in one step
    props
  );
};

const FlagWidget = props => {
  const {
    flag,
    selectedIdx,
    tables,
    mkTableEntry,
    handleMouseLeave,
    langtag,
    selectedLang
  } = props;

  return (
    <div className={"flag-widget tile " + flag}>
      <Header {...props} />
      <div
        onMouseLeave={handleMouseLeave}
        style={{ width: "100%", height: "100%" }}
      >
        <AutoSizer>
          {({ width, height }) => (
            <List
              width={width}
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

const LoadingFlagWidget = props => (
  <div
    className={classNames("flag-widget tile", {
      wide: props.flag === "needs_translation"
    })}
  >
    <Header {...props} />
    <Spinner isLoading />
  </div>
);

FlagWidget.propTypes = {
  langtag: PropTypes.string.isRequired,
  flag: PropTypes.string.isRequired
};

const FlagWidgetContainer = props => {
  const { langtag, requestedData, config, flag } = props;
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [selectedLang, setSelectedLang] = useState(() =>
    getFirstEditableLang(langtag)
  );

  const handleMouseLeave = useCallback(() => setSelectedIdx(-1), []);
  const setSelection = useCallback(index => setSelectedIdx(index), []);
  const setLangtag = useCallback(lang => setSelectedLang(lang), []);

  const statefulProps = {
    ...props,
    selectedIdx,
    selectedLang,
    handleMouseLeave,
    setSelection,
    setLangtag
  };

  if (f.isNil(requestedData)) {
    return <LoadingFlagWidget {...statefulProps} />;
  }

  const sortedProps = sortEntries(pickTables(statefulProps));
  const { tables } = sortedProps;

  const mkTableEntry = ({ index, style }) => {
    const table = f.getOr({}, index, tables);
    return (
      <TableEntry
        key={f.get("id", table)}
        style={style}
        table={table}
        index={index}
        selected={selectedIdx === index}
        active={selectedIdx >= 0}
        handleMouseEnter={setSelection}
        flag={flag}
        config={config}
        langtag={langtag}
        selectedLang={selectedLang}
      />
    );
  };

  return <FlagWidget {...sortedProps} mkTableEntry={mkTableEntry} />;
};

export default React.memo(FlagWidgetContainer);
