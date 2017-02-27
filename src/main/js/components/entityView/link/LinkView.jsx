import React, {PropTypes, Component} from "react";
import LinkLabelCell from "../../cells/link/LinkLabelCell.jsx";

class LinkView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "LinkView";
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired
  };

  render() {
    const {cell, langtag} = this.props;

    const links = cell.value.map(function (element, index) {
      return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={cell}
                            langtag={langtag} deletable={false} clickable={true}/>;
    });

    return (
      <div className="view-content link">
        {links}
      </div>
    );
  }
}

export default LinkView;
