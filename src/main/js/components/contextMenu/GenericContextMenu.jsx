import React from "react";
import ReactDom from "react-dom";
import * as _ from "lodash/fp"

class GenericContextMenu extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      x: props.x,
      y: props.y
    }
  }

  componentDidMount() {
    const {x, y} = this.props
    const offset = this.props.offset || 0;
    const el = ReactDom.findDOMNode(this);
    const xPos = _.clamp(0, window.innerWidth - el.offsetWidth, x + offset)
    const yPos = _.clamp(0, window.innerHeight - el.offsetHeight, y + offset)

    console.log("offset:", offset, "x:",x,"=>",xPos, "y:",y,"=>",yPos,
      "\n-- window:",window.innerWidth,window.innerHeight,
      "\n-- element", el.offsetWidth, el.offsetHeight
    )

    this.setState({
      x: xPos,
      y: yPos
    })
  }

  render() {
    const {x, y} = this.state;
    const cssStyle = {
      left: x,
      top: y
    };

    return (
      <div className="context-menu" style={cssStyle}>
        {this.props.menuItems}
      </div>
    );
  }
}

GenericContextMenu.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  menuItems: React.PropTypes.element.isRequired,
  offset: React.PropTypes.number
};

module.exports = GenericContextMenu;