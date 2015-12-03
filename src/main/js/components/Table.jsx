var React = require('react');
var ReactDOM = require('react-dom');
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

  /**
   * This is an anti-patter on purpose
   * Don't change this, its more performant than using this.state !
   */
  headerDOMElement : null,
  scrolledXBefore : 0,

  getInitialState : function () {
    return {
      offsetTableData : 0,
      windowHeight : window.innerHeight,
      scrolledHorizontal : 0
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

  componentDidMount : function () {
    this.setState({offsetTableData : ReactDOM.findDOMNode(this.refs.dataWrapper).getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    this.headerDOMElement = document.getElementById("tableHeader");
    window.addEventListener("resize", this.windowResize);
  },

  componentWillUnmount : function () {
    window.removeEventListener("resize", this.windowResize);
  },

  handleScroll : function (e) {
    //only when horizontal scroll changed
    if (e.target.scrollLeft != this.scrolledXBefore) {
      var scrolledX = e.target.scrollLeft;
      //Don't change this to state, its more performant during scroll
      this.headerDOMElement.style.left = -scrolledX + "px";
      this.scrolledXBefore = scrolledX;
    }
  },

  /**
   * The cleaner function but costs more performance when scrolling on IE or Mac with Retina
   */
  /*handleScrollReact : function (e) {
   var scrolledX = e.target.scrollLeft;
   this.setState({scrolledHorizontal : scrolledX});
   },*/

  windowResize : function () {
    this.setState({windowHeight : window.innerHeight});
  },

  tableDataHeight : function () {
    return {height : (this.state.windowHeight - this.state.offsetTableData) + "px"};
  },

  render : function () {
    return (
      <section id="table-wrapper" ref="tableWrapper">
        <div className="tableaux-table" ref="tableInner">
          <Columns ref="columns" columns={this.props.table.columns}/>
          <div ref="dataWrapper" className="data-wrapper" style={ this.tableDataHeight() }
               onScroll={this.handleScroll}>
            <Rows rows={this.props.table.rows} langtag={this.props.langtag}/>
            <NewRow table={this.props.table} langtag={this.props.langtag}/>
          </div>

        </div>
      </section>
    );
  }
});

module.exports = Table;
