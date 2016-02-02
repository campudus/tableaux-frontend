var React = require('react');
var TableSwitcher = require('./TableSwitcher.jsx');
var Dispatcher = require('../../dispatcher/Dispatcher.js');
var ActionTypes = require('../../constants/TableauxConstants.js').ActionTypes;

var TableTools = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tableName : React.PropTypes.string.isRequired,
    currentTableId : React.PropTypes.number.isRequired,
    tables : React.PropTypes.object
  },

  getInitialState : function () {
    return {
      switcherOpen : false
    };
  },

  onTableSwitched : function () {
    //close overlay
    this.setState({switcherOpen : false});
  },

  closeTableSwitch : function () {
    this.setState({switcherOpen : false});
  },

  componentWillMount : function () {
    Dispatcher.on(ActionTypes.SWITCH_TABLE, this.onTableSwitched);
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.SWITCH_TABLE, this.onTableSwitched);
  },

  tableSwitchButton : function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({switcherOpen : !this.state.switcherOpen});
  },

  render : function () {
    var tableSwitcher;
    if (this.state.switcherOpen) {
      tableSwitcher = <TableSwitcher key="tableswitcher"
                                     currentId={this.props.currentTableId}
                                     tables={this.props.tables}
                                     langtag={this.props.langtag}
                                     onClickOutside={this.closeTableSwitch}
      />
    }

    return (
      <div id="table-tools">
        <div id="table-switcher" className={this.state.switcherOpen ? "active": ""}>
          <a href="#" onClick={this.tableSwitchButton} id="current-table">
            <i className="fa fa-columns"></i>
            <span>{this.props.tableName}</span>
            <i className="fa fa-angle-down"></i>
          </a>
          {tableSwitcher}
        </div>
      </div>
    )
  }
});

module.exports = TableTools;