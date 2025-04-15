import { translate } from "react-i18next";
import React, { useState, useEffect } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { getTableDisplayName } from "../../helpers/multiLanguage";
import { ifElse } from "../../helpers/functools";
import { makeRequest } from "../../helpers/apiHelper";
import LinkList from "../helperComponents/LinkList";
import Spinner from "../header/Spinner";
import SvgIcon from "../helperComponents/SvgIcon";
import getDisplayName from "../../helpers/getDisplayValue";
import route from "../../helpers/apiRoutes";

// Builds the actual dependent tables/rows DOM elements
const DependentRowsList = props => {
  const { row, table, langtag, t, cell } = props;
  const [dependencies, setDependencies] = useState(null);

  const checkDependencies = async () => {
    const response = await makeRequest({
      apiRoute: route.toRow({ tableId: table.id, rowId: row.id }) + "/dependent"
    }).then(f.prop("dependentRows"));
    ifElse(
      f.lt(0),
      props.hasDependency || f.noop,
      props.hasNoDependency || f.noop,
      f.size(response)
    );
    setDependencies(response);
  };

  // useEffect may not return a Promise, so this is a workaround
  // FIXME: Improve this once React provides a more idiomatic solution
  useEffect(() => {
    checkDependencies();
  }, []);

  if (f.isNil(dependencies)) {
    return (
      <div className="dependent-loading-data">
        <Spinner isLoading={true} />
        <p>{t("fetching_dependent_rows")}</p>
      </div>
    );
  }

  const tables = f.map("table", dependencies); // no need to request all tables

  const dependentTables = (dependencies || []).map(
    ({ table, column, rows }, idx) => {
      const tableId = table.id;
      const linkToTable = `/${langtag}/tables/${tableId}`;
      const tableName = getTableDisplayName(table, langtag);
      const links = rows.map(row => {
        const displayNameObj = getDisplayName(column, row.value);
        const extractDisplayString = f.isArray(displayNameObj)
          ? f.compose(f.join(" "), f.map(langtag))
          : f.get(langtag);
        return {
          displayName: extractDisplayString(displayNameObj),
          linkTarget: { tables, tableId, rowId: row.id, langtag }
        };
      });

      return (
        <div className="item" key={idx}>
          <button
            className="item-header"
            onClick={() => window.open(linkToTable, "_blank")}
          >
            {tableName}
            <SvgIcon icon="tablelink" containerClasses="color-primary" />
          </button>
          <LinkList
            showToggleButton={false}
            langtag={langtag}
            key={table.id}
            links={links}
            cell={cell}
          />
        </div>
      );
    }
  );

  return (
    <div className="dependent-wrapper">
      <div className="content-items">
        {dependentTables.length < 1 ? (
          <div className="item">
            {i18n.t("table:dependent-rows.no-dependent-rows-header")}
          </div>
        ) : (
          dependentTables
        )}
      </div>
    </div>
  );
};

export default translate("table")(DependentRowsList);
DependentRowsList.propTypes = {
  row: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  hasDependency: PropTypes.func,
  hasNoDependency: PropTypes.func
};
