import React from "react";
import Header from "../../overlay/Header";
import SearchBar from "./LinkOverlaySearchBar";
import { SwitchSortingButton } from "./LinkOverlayFragments";
import Spinner from "../../header/Spinner";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

const sortIcons = ["fa fa-sort-numeric-asc", "fa fa-sort-alpha-asc"];

const LinkOverlayHeader = props => {
  const {
    langtag,
    loading,
    sharedData,
    updateSharedData,
    id,
    cell: { table },
    unlinkedOrder,
    filterMode,
    filterValue
  } = props;

  const {
    passKeystrokeToBody,
    setFilterValue,
    setFilterMode,
    setUnlinkedOrder
  } = sharedData;
  const tableName = retrieveTranslation(langtag, table.displayName);

  return (
    <Header context={tableName} id={props.id} {...props}>
      <SearchBar
        langtag={langtag}
        id={id}
        onKeyStroke={passKeystrokeToBody}
        setFilterValue={setFilterValue}
        setFilterMode={setFilterMode}
        filterMode={filterMode}
        filterValue={filterValue}
        updateSharedData={updateSharedData}
      />
      <SwitchSortingButton
        sortOrder={unlinkedOrder}
        setSortOrder={setUnlinkedOrder}
        sortIcons={sortIcons}
      />
      <Spinner isLoading={loading} customOptions={{ color: "#eee" }} />
    </Header>
  );
};

export default LinkOverlayHeader;
