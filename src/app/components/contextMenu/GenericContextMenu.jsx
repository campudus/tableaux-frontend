/*
 * Displays a context menu with given menuItems at given (x,y) coordinates.
 * Optional props:
 * - offset: x- and y-offset towards (x,y) coordinates
 * - align: which corner should appear at (x,y) coordinates,
 *   see TableauxConstants.Alignments
 */

import React from "react";
import ReactDom from "react-dom";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

class GenericContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: props.x,
      y: props.y
    };
  }

  componentDidMount() {
    const {align, noClampX, noClampY, x, y} = this.props;
    const offset = this.props.offset || 0;
    const el = ReactDom.findDOMNode(this);
    const dataWrapper = f.first(document.getElementsByClassName("ReactVirtualized__Grid"));
    
    if (x) {
      const w = Math.max(this.props.minWidth || 1, el.offsetWidth);
      const xShift = ((f.endsWith("RIGHT", align)) ? w : 0); // shift to align corner at (x,y)
      const xPos = (noClampX)
        ? x + offset - xShift
        : f.clamp(0, window.innerWidth - w, x + offset - xShift);
      this.setState({x: xPos});
    }

    if (y) {
      const h = el.offsetHeight;
      const yShift = ((f.startsWith("LOWER", align)) ? h : 0);
      const yPos = (noClampY)
        ? y + offset - yShift
        : f.clamp(0, window.innerHeight - h - dataWrapper.getBoundingClientRect().top, y + offset - yShift);
      this.setState({y: yPos});
    }
  }

  render() {
    const {x, y} = this.state;
    const cssStyle = f.reduce(
      f.assign, {},
      [
        (x) ? {left: x} : null,
        (y) ? {top: y} : null
      ]
    );
    return (
      <div className="context-menu row-context-menu" style={cssStyle}>
        {this.props.menuItems || this.props.children}
      </div>
    );
  }
}

GenericContextMenu.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  menuItems: PropTypes.element,
  offset: PropTypes.number,
  alignment: PropTypes.string,
  minWidth: PropTypes.number
};

module.exports = GenericContextMenu;
