var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var LinkOverlay = require('./LinkOverlay.jsx');
var LinkLabelCell = require('./LinkLabelCell.jsx');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');

var LinkEditCell = React.createClass({

    mixins : [],

    propTypes : {
      cell : React.PropTypes.object.isRequired,
      langtag : React.PropTypes.string.isRequired,
      editing : React.PropTypes.bool.isRequired,
      setCellKeyboardShortcuts : React.PropTypes.func
    },

    componentDidMount : function () {
      var self = this;
      this.props.setCellKeyboardShortcuts({
        enter : function (event) {
          //stop handling the Table events
          event.stopPropagation();
          event.preventDefault();
          self.openOverlay();
        }
      });
    },

    componentWillUnmount : function () {
      //Important to clean up the keyboard shortcuts
      this.props.setCellKeyboardShortcuts({});
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
        return <LinkLabelCell key={arrayIndex} id={element.id} deletable={true} linkElement={element}
                              cell={self.props.cell} langtag={self.props.langtag} onDelete={self.removeLink}/>;
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
