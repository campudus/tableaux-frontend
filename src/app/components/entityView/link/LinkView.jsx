import { withProps } from "recompose";
import React, { Component } from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { openLinkOverlay } from "../../cells/link/LinkOverlay";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { when } from "../../../helpers/functools";
import Empty from "../../helperComponents/emptyEntry";
import LinkList from "../../helperComponents/LinkList";

class LinkView extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool,
    actions: PropTypes.object.isRequired
  };

  openOverlay = () => {
    const { cell, langtag, actions } = this.props;
    openLinkOverlay({ cell, langtag, actions });
  };

  removeLink = id => () => {
    if (this.props.thisUserCantEdit) {
      return;
    }
    const { cell, actions } = this.props;
    const newValue = f.pullAt(id, cell.value);
    actions.changeCellValue({ cell, oldValue: cell.value, newValue });
  };

  applySwap = ordering => () => {
    const {
      value,
      linkList,
      actions,
      cell: { table, row, column }
    } = this.props;

    const rearranged = f.map(
      id => f.find(linkedItem => linkedItem.id === id, linkList),
      ordering
    );
    actions.changeCellValue({
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue: value,
      newValue: rearranged
    });
  };

  render() {
    const {
      actions,
      langtag,
      linkList,
      cell,
      cell: { value }
    } = this.props;

    return f.isEmpty(linkList) ? (
      <div className="item-description">
        {i18n.t("table:empty.links")}
        {this.props.children}
      </div>
    ) : (
      <div>
        <LinkList
          links={linkList}
          langtag={langtag}
          unlink={this.removeLink}
          cell={cell}
          actions={actions}
          value={value}
          sortable
        />
        {this.props.children}
      </div>
    );
  }
}
const mkLinkList = (cell, langtag) => {
  const translate = when(f.isPlainObject, retrieveTranslation(langtag));
  return cell.value.map((link, idx) => {
    const displayName = translate(cell.displayValue[idx]) || (
      <Empty langtag={langtag} />
    );

    return {
      label: displayName,
      displayName,
      linkTarget: {
        tables: cell.tables,
        tableId: cell.column.toTable,
        rowId: link.id,
        langtag
      },
      id: link.id,
      value: link.value
    };
  });
};

export default withProps(({ value, grudData, cell, langtag }) => {
  const linkList = mkLinkList(cell, langtag);
  try {
    const displayValues = grudData.displayValues[cell.column.toTable];
    const linkDisplayValues = value.map(({ id }) => {
      const displayValueObject = f.find(f.propEq("id", id), displayValues);
      return displayValueObject.values[0];
    });
    return { displayValues: linkDisplayValues, linkList };
  } catch (err) {
    // Worker is not done creating display values
    return { displayValues: cell.displayValue || [], linkList };
  }
})(LinkView);
