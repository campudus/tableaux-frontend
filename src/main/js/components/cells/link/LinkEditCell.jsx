var React = require('react');
var _ = require('lodash');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var LinkLabelDeleteCell = require('./LinkLabelDeleteCell.jsx');
var LinkOverlay = require('./LinkOverlay.jsx');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');

var LinkEditCell = React.createClass({

    mixins : [KeyboardShortcutsMixin],

    propTypes : {
      cell : React.PropTypes.object.isRequired,
      langtag : React.PropTypes.string.isRequired
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

    getKeyboardShortcuts : function (event) {
      var self = this;
      return {
        enter : function (event) {
          //stop handling the Table events
          event.stopPropagation();
          event.preventDefault();
          self.openOverlay();
        }
      };
    },

    removeLink : function (idx) {
      var cell = this.props.cell;
      var newValue = _.filter(cell.value, function (element, arrayIndex) {
        return element.id !== idx;
      });
      Dispatcher.trigger('change-cell:' + cell.tableId + ':' + cell.column.getId() + ':' + cell.rowId,
        {newValue : newValue});
    },

    openOverlay : function () {
      Dispatcher.trigger('toggleCellEditing', {
        cell : this.props.cell
      });
      Dispatcher.trigger(
        'open-overlay', {
          head : <OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag}/>,
          body : <LinkOverlay cell={this.props.cell} langtag={this.props.langtag}/>,
          type : "normal"
        });
    },

    render : function () {
      var self = this;
      var links = self.props.cell.value.map(function (element, arrayIndex) {
        return <LinkLabelDeleteCell key={arrayIndex} id={element.id} linkElement={element} cell={self.props.cell}
                                    langtag={self.props.langtag} onDelete={self.removeLink}/>;
      });

      links.push(<button key={"add-btn"} className="add" onClick={self.openOverlay}>+</button>);

      return (
        <div className={'cell-content'}>
          {links}
        </div>
      );
    }

  })
  ;

module.exports = LinkEditCell;
