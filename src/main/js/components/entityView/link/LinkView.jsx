import React from "react";
import LinkLabelCell from "../../cells/link/LinkLabelCell.jsx";

const LinkView = React.createClass({

  displayName: "LinkView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  },

  render: function () {
    const {cell, langtag} = this.props;

    const links = cell.value.map(function (element, index) {
      return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={cell}
                            langtag={langtag} deletable={false} clickable={true}/>;
    });

    return (
      <div className='view-content link'>
        {links}
      </div>
    );
  }
});

export default LinkView;
