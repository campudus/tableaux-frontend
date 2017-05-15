import React, {Component, PropTypes} from "react";
import {openLinkOverlay} from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import {isEmpty, prop, pullAt} from "lodash/fp";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";

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
    console.log("remove link no.", id)
    const {cell} = this.props;
    const newValue = pullAt(id, cell.value);
    ActionCreator.changeCell(cell, newValue);
  };

  mkLinkList = (cell, langtag) => {
    const tableUrl = `/${langtag}/tables/${cell.column.toTable}`;

    return cell.value.map(
      (link, idx) => {
        return {
          displayName: cell.linkString(idx, langtag),
          linkTarget: {
            tables: cell.tables,
            tableId: cell.column.toTable,
            rowId: link.id
          }
        }
      }
    );
  };

  render() {
    const {cell, langtag} = this.props;
    const links = this.mkLinkList(cell, langtag);

    return (isEmpty(links)
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
