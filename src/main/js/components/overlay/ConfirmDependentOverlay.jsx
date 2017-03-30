import React, {Component, PropTypes} from "react";
import ActionCreator, {openOverlay, removeRow} from "../../actions/ActionCreator";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import i18n from "i18next";
import DependentRowsList from "../../components/rows/DependentRowsList";
import Header from "./Header";
import Footer from "./Footer";
import InfoBox from "./InfoBox";

class RowsOverlay extends Component {
  static propTypes = {
    row: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    deleteInfo: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {depMessage:  <p>{i18n.t("table:fetching_dependent_rows")}</p>}
  }

  hasDependencies = n => {
    this.setState({depMessage: <p>{i18n.t("table:delete_row_dependent_text")}</p>});
  };

  hasNoDependencies = () => {
    this.setState({depMessage: <p>{i18n.t("table:no_dependent_text")}</p>});
  };

  render() {
    const {depMessage} = this.state;
    const {row, langtag, deleteInfo} = this.props;
    const firstCell = row.cells.at(0);
    const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);

    return (
      <div className="delete-row-confirmation">
        {(deleteInfo)
          ? (<InfoBox className="item"
                      type="warning"
                      heading={i18n.t("table:confirm_delete_row", {rowName: rowDisplayLabel})}
                      message={depMessage}
            />
          )
          : null
        }
        <DependentRowsList className="item"
                           row={row} langtag={langtag}
                           hasDependency={this.hasDependencies}
                           hasNoDependency={this.hasNoDependencies}
        />
      </div>
    )
  }
}

export function confirmDeleteRow(row, langtag) {
  const onYesRowDelete = () => {
    removeRow(row.tableId, row.getId());
    ActionCreator.resetTableURL();
  };

  const buttons = {
    negative: [i18n.t("common:delete_yes_explicit"), onYesRowDelete],
    neutral: [i18n.t("common:cancel"), null]
  };

  const cell = row.cells.at(0);
  const itemName = RowConcatHelper.getCellAsStringWithFallback(cell.value, cell.column, langtag);

  openOverlay({
    head: <Header context={i18n.t("table:delete_row")} title={itemName} />,
    body: <RowsOverlay row={row} langtag={langtag} deleteInfo={true} />,
    footer: <Footer actions={buttons} />,
    type: "full-height"
  });
}

export function openShowDependency(row, langtag) {
  const cell = row.cells.at(0);
  const itemName = RowConcatHelper.getCellAsStringWithFallback(cell.value, cell.column, langtag);

  openOverlay({
    head: <Header context={i18n.t("table:dependencies")} title={itemName} actions={{neutral: [i18n.t("common:close"), null]}}/>,
    body: <RowsOverlay row={row} langtag={langtag} />,
    type: "full-height"
  });
}

