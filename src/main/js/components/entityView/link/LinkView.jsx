import React, {PropTypes, Component} from "react";
import {openLinkOverlay} from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import {prop, pullAt} from "lodash/fp";

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
          linkTarget: `${tableUrl}/rows/${link.id}?filter&overlay`
        }
      }
    );
  };

  render() {
    const {cell, langtag} = this.props;
    const links = this.mkLinkList(cell, langtag);

    return (
      <LinkList links={links}
                setLink={() => () => {}}
                unlink={() => () => {}}
      />
    );
  }
}

export default LinkView;
