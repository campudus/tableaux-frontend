import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {openLinkOverlay} from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import {isLocked} from "../../../helpers/annotationHelper";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";
import {compose, lifecycle, withHandlers} from "recompose";

const withFunctionality = compose(
  withHandlers({
    openOverlay: (props) => () => {
      const {cell, langtag} = props;
      if (isUserAdmin() && !isLocked(cell.row)) {
        openLinkOverlay(cell, langtag);
      }
    },
    catchScrolling: (props) => (event) => event.stopPropagation()
  }),
  lifecycle({
    componentDidMount() {
      this.props.setCellKeyboardShortcuts({
        enter: (event) => {
          if (!isLocked(this.props.cell.row)) {
            event.stopPropagation();
            event.preventDefault();
            this.openOverlay();
          }
        }
      });
    },
    componentWillUnmount() {
      this.props.setCellKeyboardShortcuts({});
    }
  })
);

const LinkEditCell = (props) => {
  const {cell, langtag} = props;
  const links = cell.value.map(
    (element, index) => (
      <LinkLabelCell
        key={element.id} clickable={false} linkElement={element}
        cell={cell} langtag={langtag}
        linkIndexAt={index}
      />
    )
  );

  return (
    <div
      className={"cell-content"}
      onScroll={props.catchScrolling}
      onClick={props.openOverlay}
    >
      {[...links, <button key={"add-btn"} className="edit"><span className="fa fa-pencil"></span></button>]}
    </div>
  );
};

LinkEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default withFunctionality(LinkEditCell);
