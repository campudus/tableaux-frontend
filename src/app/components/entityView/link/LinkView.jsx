import React, { Component } from "react";
import PropTypes from "prop-types";
import { openLinkOverlay } from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import i18n from "i18next";
import * as f from "lodash/fp";
import { reportUpdateReasons } from "../../../helpers/devWrappers";
import Empty from "../../helperComponents/emptyEntry";
import { withProps } from "recompose";

class LinkView extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool,
    actions: PropTypes.object.isRequired
  };

  // componentDidUpdate = reportUpdateReasons("link").bind(this);

  openOverlay = () => {
    const { cell, langtag, actions } = this.props;
    openLinkOverlay({ cell, langtag, actions });
  };

  removeLink = id => () => {
    if (this.props.thisUserCantEdit) {
      return;
    }
    const { cell, actions, value } = this.props;
    const newValue = f.pullAt(id, cell.value);
    actions.changeCellValue({ cell, oldValue: value, newValue });
  };

  mkLinkList = (cell, langtag) => {
    return cell.value.map((link, idx) => {
      return {
        displayName: f.get([idx, langtag], this.props.displayValues) || (
          <Empty langtag={langtag} />
        ),
        linkTarget: {
          tables: cell.tables,
          tableId: cell.column.toTable,
          rowId: link.id
        }
      };
    });
  };

  render() {
    const { cell, langtag, value } = this.props;
    const links = this.mkLinkList(cell, langtag);

    return f.isEmpty(links) ? (
      <div className="item-description">
        {i18n.t("table:empty.links")}
        {this.props.children}
      </div>
    ) : (
      <div>
        <LinkList links={links} langtag={langtag} unlink={this.removeLink} />
        {this.props.children}
      </div>
    );
  }
}

export default withProps(({ value, grudData, cell }) => {
  try {
    const displayValues = grudData.displayValues[cell.column.toTable];
    const linkDisplayValues = value.map(({ id }) => {
      const displayValueObject = f.find(f.propEq("id", id), displayValues);
      return displayValueObject.values[0];
    });
    return { displayValues: linkDisplayValues };
  } catch (err) {
    // Worker is not done creating display values
    return { displayValues: cell.displayValue || [] };
  }
})(LinkView);
