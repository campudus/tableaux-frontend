var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../dispatcher/Dispatcher');

var Columns = require('./Columns.jsx');
var Rows = require('./Rows.jsx');
var NewRow = require('./NewRow.jsx');

var Table = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Table',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    table : React.PropTypes.object.isRequired
  },

  getInitialState : function () {
    return {
      stickyHeader : false,
      headerHeight : 0
    }
  },

  componentWillMount : function () {
    var table = this.props.table;

    table.columns.fetch({
      success : function () {
        table.rows.fetch();
      }
    });
  },

  guiUpdate : function (isSticky) {
    if (typeof isSticky !== 'undefined') {
      this.setState({stickyHeader : isSticky});
    }
    this.setState({headerHeight : this.refs.columns.getHeaderHeight()});
  },

  componentWillUnmount : function () {
    console.log('Table.componentWillUnmount', this.props.table.getId());
    window.removeEventListener('scroll', this.handleScroll);
  },

  render : function () {

    var self = this;

    function paddingCalc() {
      if (self.state.stickyHeader) {
        return self.state.headerHeight + "px";
      } else return 0;
    }

    return (
      <section id="table-wrapper" ref="tableWrapper">
        <div style={{paddingTop: paddingCalc()}}
             className={this.state.stickyHeader ? 'tableaux-table sticky' : 'tableaux-table'} ref="tableInner">
          <Columns ref="columns" columns={this.props.table.columns} guiUpdate={this.guiUpdate}/>

          <Rows rows={this.props.table.rows} langtag={this.props.langtag}/>

          <NewRow table={this.props.table} langtag={this.props.langtag}/>
        </div>
      </section>
    );
  }
});

module.exports = Table;
