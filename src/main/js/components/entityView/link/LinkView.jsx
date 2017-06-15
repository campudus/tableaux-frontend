import React, {Component, PropTypes} from "react";
import {openLinkOverlay} from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";
import * as f from "lodash/fp";

class LinkView extends Component {

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    openLinkOverlay(cell, langtag);
  };

  removeLink = id => () => {
    if (this.props.thisUserCantEdit) {
      return;
    }
    const {cell} = this.props;
    const newValue = f.pullAt(id, cell.value);
    ActionCreator.changeCell(cell, newValue);
  };

  mkLinkList = (cell, langtag) => {
    return cell.value.map(
      (link, idx) => {
        return {
          displayName: f.get([idx, langtag], cell.displayValue || ""),
          linkTarget: {
            tables: cell.tables,
            tableId: cell.column.toTable,
            rowId: link.id
          }
        };
      }
    );
  };

  render() {
    const {cell, langtag} = this.props;
    const links = this.mkLinkList(cell, langtag);

    return (f.isEmpty(links)
        ? (
          <div className="item-description">
            {i18n.t("table:empty.links")}
            {this.props.children}
          </div>
        )
        : (
          <div><LinkList links={links}
                         langtag={langtag}
                         unlink={this.removeLink}
          />
            {this.props.children}
          </div>
        )
    );
  }
}

export default LinkView;
