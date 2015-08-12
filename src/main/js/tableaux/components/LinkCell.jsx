var React = require('react');
var SearchLink = require('./SearchLink.jsx');
var LinkOverlay = require('./LinkOverlay.jsx');
var EditLinkCell = require('./EditLinkCell.jsx');
var LabelLinkCell = require('./LabelLinkCell.jsx');
var Dispatcher = require('../Dispatcher');
var _ = require('lodash');

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

  openOverlay:function(){
    console.log("trigger openOverlay");
    Dispatcher.trigger('openOverlay',this.props.cell);
  },

  render : function () {
    var self = this;
    var cell = this.props.cell;
    return (
      <div className={'cell link cell-' + cell.column.getId() + '-' + cell.rowId}>
        {cell.value.map(function (e, i) {
          if (self.state.editing[i]) {
            return <EditLinkCell key={i}
                                 onBlur={self.editDone(e, i).bind(self)}
                                 onRemove={self.removeLink(i).bind(self)}
                                 element={e}
                                 cell={cell}/>;
          } else {
            return <LabelLinkCell key={i} click={self.linkClick(e, i).bind(self)} element={e} cell={cell}/>;
          }
        })}
        <button onClick={self.openOverlay}>+</button>
      </div>
    );
  }

});

module.exports = LinkCell;
