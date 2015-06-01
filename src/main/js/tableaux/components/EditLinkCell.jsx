var React = require('react');
var OutsideClick = require('react-onclickoutside');

var Cell = React.createClass({

  mixins : [OutsideClick],

  removeLink : function () {
    console.log('remove link', this.props.element, 'in', this.props.cell);
    this.props.onRemove();
  },

  handleClickOutside : function (evt) {
    console.log('clicked outside', evt);
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

module.exports = Cell;
