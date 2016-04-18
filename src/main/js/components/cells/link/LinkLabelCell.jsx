var React = require('react');
var RowConcatHelper = require('../../../helpers/RowConcatHelper.js');

var LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,

    //Used for performance reason to get cached derived value from the cell model
    linkIndexAt : React.PropTypes.number.isRequired,

    //optional for delete label
    deletable : React.PropTypes.bool.isRequired,
    onDelete : React.PropTypes.func
  },

  getLinkName : function () {
    const {cell, langtag, linkIndexAt} = this.props;
    return cell.linkString(linkIndexAt, langtag);
  },

  removeLinkHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.linkElement.id);
  },

  render : function () {
    var theClassName = "link-label";
    var hasDeleteButton = this.props.deletable;
    var deleteButton = <i onClick={this.removeLinkHandler} className="fa fa-times"></i>;

    if (hasDeleteButton) {
      theClassName += " delete";
    }

    return (
      <span className={theClassName}>{this.getLinkName()}{hasDeleteButton ? deleteButton : ""}</span>
    );

  }

});

module.exports = LinkLabelCell;
