var React = require('react');
var RowConcatHelper = require('../../../helpers/RowConcatHelper.js');

var LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,

    //optional for delete label
    deletable : React.PropTypes.bool.isRequired,
    id : React.PropTypes.number,
    onDelete : React.PropTypes.func
  },

  getInitialState : function () {
    return {
      linkName : ""
    }
  },

  componentWillMount : function () {
    //Build the linkname once at the beginning
    this.setState({
      linkName : this.getLinkName()
    });

  },

  getLinkName : function () {
    var toColumn = this.props.cell.column.toColumn;
    var linkElementVal = this.props.linkElement.value;
    var linkName = RowConcatHelper.getRowConcatStringWithFallback(linkElementVal, toColumn, this.props.langtag);
    return linkName;
  },

  removeLinkHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.id);
  },

  render : function () {
    var theClassName = "link-label";
    var hasDeleteButton = this.props.deletable;
    var deleteButton = <i onClick={this.removeLinkHandler} className="fa fa-times"></i>;

    if (hasDeleteButton) {
      theClassName += " delete";
    }

    return (
      <span className={theClassName}>{this.state.linkName}{hasDeleteButton ? deleteButton : ""}</span>
    );

  }

});

module.exports = LinkLabelCell;
