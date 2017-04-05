import React, {PropTypes, Component} from "react";
import {openLinkOverlay} from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import {prop, pullAt} from "lodash/fp";
import ActionCreator from "../../../actions/ActionCreator";

class LinkView extends Component {
  
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    openLinkOverlay(cell, langtag);
  };

  removeLink = id => () => {
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
          linkTarget: {tables: cell.tables, tableId: cell.column.toTable, rowId: link.id}
        }
      }
    );
  };

  render() {
    const {cell, langtag} = this.props;
    const links = this.mkLinkList(cell, langtag);

    return (
      <LinkList links={links}
                langtag={langtag}
                unlink={this.removeLink}
      />
    );
  }
}

export default LinkView;
