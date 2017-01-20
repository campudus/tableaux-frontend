import React from "react";
import GenericContextMenu from "./GenericContextMenu";
import TableauxConstants from "../../constants/TableauxConstants";
const Alignments = TableauxConstants.Alignments;
const ARROW_WIDTH = 32;

class ColumnContextMenu extends React.Component {
  constructor(props) {
    super(props);
    const {x, y} = props;
    this.state = {
      x: x,
      y: y
    }
  }

  render() {
    const {x,y} = this.props
    return (
      <GenericContextMenu
        x={x} y={y}
        align={Alignments.UPPER_RIGHT}
        menuItems={this.props.menuItems} />
    )
  }
}

ColumnContextMenu.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  menuItems: React.PropTypes.element.isRequired,
//  column: React.PropTypes.object.isRequired,
  offset: React.PropTypes.number
};

module.exports = ColumnContextMenu;