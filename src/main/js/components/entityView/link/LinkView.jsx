import React from "react";
import LinkLabelCell from "../../cells/link/LinkLabelCell.jsx";
import i18n from "i18next";
import {ActionTypes} from "../../../constants/TableauxConstants";
import ActionCreator from "../../../actions/ActionCreator";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import LinkOverlay from "../../cells/link/LinkOverlay";

class LinkView extends Component {

  displayName: "LinkView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  },

  render: function () {
    const {cell, langtag} = this.props;

    const links = cell.value.map((element, index) => {
      return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={cell}
                            langtag={langtag} deletable={true} onDelete={this.removeLink(element.id)}
                            clickable={true}/>;
    });

    return (
      <div className="view-content link">
        <a href="#" tabIndex={tabIdx} className="edit-links-button" onClick={this.openOverlay} ref={el => this.focusTarget = el} >
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
