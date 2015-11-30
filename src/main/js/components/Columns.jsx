var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var tableHeaderDefaultCoordinates;

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      stickyHeader : false,
      tableHeaderDefaultCoordinates : {
        x : 0,
        y : 0
      },
      stickyHeaderOffset : 0
    };
  },

  getHeaderHeight : function () {
    return this.refs.tableHeader.offsetHeight;
  },

  //add sticky class, also to parent and set correct x offset of header
  handleScroll : function (event) {
    var scrolledX = event.srcElement.body.scrollLeft;
    var scrolledY = event.srcElement.body.scrollTop;

    if (scrolledY >= this.state.tableHeaderDefaultCoordinates.y) {
      this.setState({stickyHeader : true});
      this.props.guiUpdate(true);
    } else {
      this.setState({stickyHeader : false});
      this.props.guiUpdate(false);
    }
    this.setState({stickyHeaderOffset : -scrolledX + this.state.tableHeaderDefaultCoordinates.x});
  },

  componentDidUpdate : function () {

  },

  componentDidMount : function () {
    var tableHeader = this.refs.tableHeader;
    var rect = tableHeader.getBoundingClientRect();
    this.setState({
      "tableHeaderDefaultCoordinates" : {
        "x" : rect.left,
        "y" : rect.top
      }
    });
    window.addEventListener('scroll', this.handleScroll);
  },

  componentWillUnmount : function () {
    window.removeEventListener('scroll', this.handleScroll);
  },

  render : function () {
    return (
      <div id="tableHeader" ref="tableHeader" className={this.state.stickyHeader ? 'heading sticky' : 'heading'}
           style={{left: this.state.stickyHeaderOffset + "px"}}>
        <div className="column-head language" key="-1"></div>
        {this.props.columns.map(function (col, index) {
          return <div className="column-head" key={index}>{col.name}</div>;
        })}
      </div>
    );
  }
});

module.exports = Columns;
