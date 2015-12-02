var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var tableHeaderDefaultCoordinates;

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    scrolledHorizontal : React.PropTypes.number.isRequired
  },

  componentDidUpdate : function () {

  },

  componentDidMount : function () {

  },

  componentWillUnmount : function () {

  },

  render : function () {

    //TODO: Left or translate ? Check modernizr support?!
    var styles = {
      transform : 'translate(-' + this.props.scrolledHorizontal + "px,0)"
    };

    return (
      <div id="tableHeader" ref="tableHeader" className="heading"
           style={styles}>
        <div className="tableHeader-inner">
          <div className="column-head language" key="-1"></div>
          {this.props.columns.map(function (col, index) {
            return <div className="column-head" key={index}>{col.name}</div>;
            })}
        </div>
      </div>
    );
  }
});

module.exports = Columns;
