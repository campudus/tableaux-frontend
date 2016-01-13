var React = require('react');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');

var BooleanCell = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired
  },

  componentDidMount : function () {
    /*
     * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
     * stop propagation to the table key listener
     */
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
  },

  componentWillUnmount : function () {
    //parameter useCapture must be true or added listener doesn't get removed
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
  },

  checkboxClick : function (event) {
    event.preventDefault();
    this.props.onSave();
  },

  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      enter : function (event) {
        //stop handling the Table events
        event.stopPropagation();
        event.preventDefault();
        self.props.onSave();
      }
    };
  },

  render : function () {
    return (
        <input className="checkbox" type="checkbox" readOnly="readonly" checked={this.props.checked}
               onClick={this.checkboxClick}/>
    );

  }
});

module.exports = BooleanCell;
