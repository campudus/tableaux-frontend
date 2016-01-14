var React = require('react');

var LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    id : React.PropTypes.number.isRequired,
    onDelete : React.PropTypes.func.isRequired
  },

  getLinkName : function (value, langtag) {
    var linkVal = langtag ? value[langtag] : value;
    return linkVal ? linkVal : null;
  },

  removeLinkHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.id);
  },

  render : function () {
    var self = this;
    var toColumnIsMultilanguage = self.props.cell.column.toColumn.multilanguage;
    var linkName;

    if (toColumnIsMultilanguage) {
      linkName = self.getLinkName(self.props.linkElement.value, self.props.langtag);
    } else {
      linkName = self.getLinkName(self.props.linkElement.value);
    }

    return (
        <span className="link-label delete">{linkName}<i onClick={self.removeLinkHandler}
                                                         className="fa fa-times"></i></span>
    );

  }

});

module.exports = LinkLabelCell;
