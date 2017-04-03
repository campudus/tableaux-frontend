import React, {PropTypes, Component} from "react";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import LinkOverlay from "../../cells/link/LinkOverlay";
import LinkList from "../../helperComponents/LinkList";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import {prop, pullAt} from "lodash/fp";

class LinkView extends Component {
  
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={cell} langtag={langtag} />,
      body: <LinkOverlay cell={cell} langtag={langtag} />,
      type: "no-scroll"
    });
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
