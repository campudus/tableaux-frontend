import React, {PropTypes, Component} from "react";
import LinkLabelCell from "../../cells/link/LinkLabelCell.jsx";
import i18n from "i18next";
import {ActionTypes} from "../../../constants/TableauxConstants";
import ActionCreator from "../../../actions/ActionCreator";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import LinkOverlay from "../../cells/link/LinkOverlay";

class LinkView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "LinkView";
  }

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
    const newValue = cell.value.filter(el => el.id !== id);
    ActionCreator.changeCell(cell, newValue);
  };

  render() {
    const {cell, langtag, tabIdx} = this.props;

    const links = cell.value.map((element, index) => {
      return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={cell}
                            langtag={langtag} deletable={true} onDelete={this.removeLink(element.id)}
                            clickable={true}/>;
    });

    return (
      <div className="view-content link">
        <a href="#" tabIndex={tabIdx} className="edit-links-button" onClick={this.openOverlay}>
          {i18n.t("table:edit_links")}
        </a>
        <div className="link-list">
          {links}
        </div>
      </div>
    );
  }
}

export default LinkView;
