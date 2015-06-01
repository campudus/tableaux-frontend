var React = require('react');
var OutsideClick = require('react-onclickoutside');

var EditLinkCell = React.createClass({

  mixins : [OutsideClick],

  removeLink : function () {
    console.log('remove link', this.props.element, 'in', this.props.cell);
    this.props.onRemove();
  },

  handleClickOutside : function (evt) {
    this.props.onBlur();
  },

  render : function () {
    return (
      <div className="link editing">
        <span className="delete" onClick={this.removeLink}>x</span>
        {this.props.element.value}
      </div>
    );
  }

});

module.exports = EditLinkCell;
