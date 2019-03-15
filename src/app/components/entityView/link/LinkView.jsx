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
    const { cell, actions, value } = this.props;
    const newValue = f.pullAt(id, cell.value);
    actions.changeCellValue({ cell, oldValue: cell.value, newValue });
  };

  mkLinkList = (cell, langtag) => {
    const translate = when(f.isPlainObject, retrieveTranslation(langtag));
    return cell.value.map((link, idx) => {
      const displayName = translate(cell.displayValue[idx]) || (
        <Empty langtag={langtag} />
      );

      return {
        displayName,
        linkTarget: {
          tables: cell.tables,
          tableId: cell.column.toTable,
          rowId: link.id,
          langtag
        }
      };
    });
  };

  render() {
    const { cell, langtag } = this.props;
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
