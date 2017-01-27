/*
 * Displays a context menu with given menuItems at given (x,y) coordinates.
 * Optional props:
 * - offset: x- and y-offset towards (x,y) coordinates
 * - align: which corner should appear at (x,y) coordinates,
 *   see TableauxConstants.Alignments
 */

import React from "react";
import ReactDom from "react-dom";
import * as _ from "lodash/fp"

class GenericContextMenu extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      x: props.x,
      y: props.y
    };
  }

  componentDidMount() {
    const {align,noClampX,noClampY,x,y} = this.props;
    const offset = this.props.offset || 0;
    const el = ReactDom.findDOMNode(this);

    if (x) {
      const w = el.offsetWidth;
      const xShift = ((_.endsWith('RIGHT', align)) ? w : 0); // shift to align corner at (x,y)
      const xPos = (noClampX) ? x + offset - xShift : _.clamp(0, window.innerWidth - w, x + offset - xShift);
      this.setState({x: xPos});
    }

    if (y) {
      const h = el.offsetHeight;
      const yShift = ((_.startsWith('LOWER', align)) ? h : 0);
      const yPos = (noClampY) ? y + offset - yShift : _.clamp(0, window.innerHeight - h, y + offset - yShift);
      this.setState({y: yPos});
    }
  }

  render() {
    const {x, y} = this.state;
    const cssStyle = _.reduce(
      _.assign, {},
      [
        (x) ? {left: x} : null,
        (y) ? {top: y} : null
      ]
    );
    return (
      <div className="context-menu row-context-menu" style={cssStyle}>
        {this.props.menuItems}
      </div>
    );
  }
}

GenericContextMenu.propTypes = {
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  menuItems: React.PropTypes.element.isRequired,
  offset: React.PropTypes.number,
  alignment: React.PropTypes.string
};

module.exports = GenericContextMenu;