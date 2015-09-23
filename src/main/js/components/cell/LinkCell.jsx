var React = require('react');
var _ = require('lodash');

var Dispatcher = require('../../dispatcher/Dispatcher');

var LinkOverlay = require('./../LinkOverlay.jsx');
var LinkEditCell = require('./LinkEditCell.jsx');
var LinkLabelCell = require('./LinkLabelCell.jsx');

var LinkCell = React.createClass({

  getInitialState : function () {
    return {editing : {}};
  },

  editDone : function (e, idx) {
    return function () {
      var editMap = this.state.editing;
      editMap[idx] = false;
      this.setState({editing : editMap});
    };
  },

  removeLink : function (idx) {
    var cell = this.props.cell;
    return function () {
      var newValue = _.filter(cell.value, function (e, i) {
        return i !== idx;
      });
      var editMap = this.state.editing;
      editMap[idx] = false;
      this.setState({editing : editMap});
      Dispatcher.trigger('change-cell:' + cell.tableId + ':' + cell.column.getId() + ':' + cell.rowId,
        {newValue : newValue});
    };
  },

  linkClick : function (e, idx) {
    return function () {
      var editMap = this.state.editing;
      editMap[idx] = true;
      this.setState({editing : editMap});
    };
  },

  openOverlay : function () {
    console.log("trigger openOverlay");
    Dispatcher.trigger('openLinkOverlay', this.props.cell);
  },

  renderLinkValue : function () {
    var self = this;

    var cell = this.props.cell;
    var language = this.props.language;

    if (cell.value === null) {
      return null;
    }

    return cell.value.map(function (e, i) {
      if (self.state.editing[i]) {
        return <LinkEditCell key={i}
                             onBlur={self.editDone(e, i).bind(self)}
                             onRemove={self.removeLink(i).bind(self)}
                             element={e}
                             cell={cell}
                             language={language}/>;
      } else {
        return <LinkLabelCell key={i} click={self.linkClick(e, i).bind(self)} element={e} cell={cell}
                              language={language}/>;
      }
    })
  },

  render : function () {
    var self = this;

    var cell = this.props.cell;

    return (
      <div className={'cell link cell-' + cell.column.getId() + '-' + cell.rowId}>
        {this.renderLinkValue()}
        <button className="add" onClick={self.openOverlay}>+</button>
      </div>
    );
  }

});

module.exports = LinkCell;
