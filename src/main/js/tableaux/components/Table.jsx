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
    table.columns.fetch();
    table.rows.fetch();

    Dispatcher.on('add-row:' + table.getId(), this.addRowEvent);
  },

  componentDidMount : function () {
    console.log("componentDidMount tableInner:");
    console.log(this.refs.tableInner.getDOMNode());
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
      <section id="table-wrapper" ref="tableWrapper">
        <div className="tableaux-table" ref="tableInner">
          <Columns columns={this.props.table.columns}/>
          <Rows rows={this.props.table.rows}/>
          <NewRow table={this.props.table} isLoading={(this.state.isCreatingNewRow)}/>
        </div>
      </section>
    );
  }
});

module.exports = Table;
