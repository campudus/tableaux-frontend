import React, { PureComponent } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { makeRequest } from "../../../helpers/apiHelper";
import EntityViewBody from "./EntityViewBody";
import EntityViewHeader from "./EntityViewHeader";
import Header from "../Header";
import Spinner from "../../header/Spinner";
import getDisplayValue from "../../../helpers/getDisplayValue";
import route from "../../../helpers/apiRoutes";

/**
 * Manages loading of a foreign row
 * Renders a Spinner while loading, an EntityView when done.
 */
export class ForeignEntityViewBody extends PureComponent {
  async componentDidMount() {
    const { id, actions, grudData, tableId, rowId } = this.props;
    try {
      const { columns } = await makeRequest({
        apiRoute: route.toColumn({ tableId })
      });
      const row = await makeRequest({
        apiRoute: route.toRow({ tableId, rowId })
      });

      // generate displayValues
      const displayValues = f
        .zip(columns, row.values)
        .map(([column, value]) => getDisplayValue(column, value));

      // generate cell object
      const cell = {
        row,
        column: f.first(columns),
        table: grudData.tables.data[tableId]
      };

      // Store loaded and transformed data in redux state
      actions.addSkeletonColumns({ tableId, result: { columns } });
      actions.addSkeletonRow({ tableId, rows: [row] });

      // Cache display values for loaded row
      actions.addDisplayValues({
        displayValues: [
          { tableId, values: [{ id: rowId, values: displayValues }] }
        ]
      });

      // set retrieved values as overlay props so we can fallback to
      // default entity view
      actions.setOverlayState({
        title: cell,
        cell,
        id,
        columns,
        row,
        table: cell.table,
        loading: false
      });
    } catch (err) {
      console.error("Could not initiate foreign row:", err);
    }
  }

  render() {
    return this.props.loading ? (
      <Spinner loading={true} />
    ) : (
      <EntityViewBody {...this.props} />
    );
  }
}

export const ForeignEntityViewHeader = props =>
  props.loading ? (
    <Header context={i18n.t("common:loading")}>
      <Spinner isLoading={true} />
    </Header>
  ) : (
    <EntityViewHeader
      {...props}
      hasMeaningfulLinks={true}
      idColumn={f.first(props.columns)}
    />
  );

ForeignEntityViewHeader.propTyps = {
  loading: PropTypes.bool.isRequired
};

ForeignEntityViewBody.propTypes = {
  tableId: PropTypes.number.isRequired,
  rowId: PropTypes.number.isRequired
};
