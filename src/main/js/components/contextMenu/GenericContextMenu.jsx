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
    const {align} = this.props;
    const offset = this.props.offset || 0;
    const el = ReactDom.findDOMNode(this);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const xShift = ((_.endsWith('RIGHT', align)) ? w : 0); // shift to align corner at (x,y)
    const yShift = ((_.startsWith('LOWER', align)) ? h : 0);
    const x = this.props.x - xShift;
    const y = this.props.y - yShift;

    this.setState({
      x: _.clamp(0, window.innerWidth - w, x + offset),
      y: _.clamp(0, window.innerHeight - h, y + offset)
    });
  }

  render() {
    const {x, y} = this.state;
    const cssStyle = {
      left: x,
      top: y
    };

    return (
      <div className="context-menu row-context-menu" style={cssStyle}>
        {this.props.menuItems}
      </div>
    );
  }
}

GenericContextMenu.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  menuItems: React.PropTypes.element.isRequired,
  offset: React.PropTypes.number,
  alignment: React.PropTypes.string
};

module.exports = GenericContextMenu;