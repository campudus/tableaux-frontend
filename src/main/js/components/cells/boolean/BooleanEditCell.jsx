var React = require('react');

var BooleanCell = React.createClass({

  mixins : [],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  },

  componentDidMount : function () {
    var self = this;
    this.props.setCellKeyboardShortcuts({
      enter : function (event) {
        //stop handling the Table events
        event.stopPropagation();
        event.preventDefault();
        self.props.onSave();
      }
    });
  },

  checkboxClick : function (event) {
    event.preventDefault();
    this.props.onSave();
  },

  render : function () {
    return (
      <input className="checkbox" type="checkbox" readOnly="readonly" checked={this.props.checked}
             onClick={this.checkboxClick}/>
    );

  }
});

module.exports = BooleanCell;
