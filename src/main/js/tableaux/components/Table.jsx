var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Columns = require('./Columns.jsx');
var Rows = require('./Rows.jsx');
var NewRow = require('./NewRow.jsx');
var Dispatcher = require('../Dispatcher');

var Table = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {isCreatingNewRow : false};
  },

  componentWillMount : function () {
    var table = this.props.table;
    table.fetch({
      success : function () {
        table.columns.fetch();
        table.rows.fetch();
      }
    });

    Dispatcher.on('add-row:' + table.getId(), this.addRowEvent);
  },

  componentDidMount: function () {
    //var width = this.refs.getDOMNode().offsetWidth;
    console.log("componentDidMount width:");
    console.log(this.refs.tableInner.getDOMNode());
    console.log(this.refs.tableInner.getDOMNode().offsetWidth);
    console.log(this.refs.tableWrapper.getDOMNode().offsetWidth);
    console.log("findDOMNode");
    console.log(React.findDOMNode(this));
  },

  componentWillUnmount : function () {
    console.log('unmounting table', this.props.table.getId());
    Dispatcher.off('add-row:' + this.props.table.getId(), this.addRowEvent);
  },

  addRowEvent : function () {
    this.setState({isCreatingNewRow : true});
  },

  render : function () {
    return (
      <div id="table-wrapper" ref="tableWrapper">
        <div key={this.props.table.getId()} className='tableaux-table' ref="tableInner">
          <Columns columns={this.props.table.columns}/>
          <Rows rows={this.props.table.rows}/>
          <NewRow table={this.props.table} isLoading={(this.state.isCreatingNewRow)}/>
        </div>
      </div>
    );
  }
});

module.exports = Table;
