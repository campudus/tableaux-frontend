var React = require('react');

var EditCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired,
    onBlur : React.PropTypes.func.isRequired
  },

  componentDidMount : function () {
    var node = this.refs.input.getDOMNode();
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  doneEditing : function () {
    this.props.onBlur(this.refs.input.getDOMNode().value);
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  render : function () {
    var inputType = 'text';
    var cell = this.props.cell;

    var value = null;
    if (cell.isMultiLanguage) {
      if (cell.value[this.props.language]) {
        value = cell.value[this.props.language];
      } else {
        // in this case we don't
        // have a value for this language
        value = "";
      }
    } else {
      value = cell.value || "";
    }

    var multiline = false;
    if (value.indexOf('\n') > -1 || value.length > 100) {
      multiline = true;
    }

    if (multiline) {
      return (
        <textarea name={this.inputName} onBlur={this.doneEditing} ref="input">{value}</textarea>
      );
    } else {
      return (
        <div className={'cell editing cell-' + cell.column.getId() + '-' + cell.rowId}>
          <input type={inputType} name={this.inputName} defaultValue={value} onBlur={this.doneEditing} ref="input"/>
        </div>
      );
    }
  }
});

module.exports = EditCell;
