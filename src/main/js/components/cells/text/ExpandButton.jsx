var React = require('react');

var ExpandButton = React.createClass({

  propTypes : {
    onTrigger : React.PropTypes.func.isRequired
  },

  //We need this wrapper function. React passes an id as second parameter we don't want
  onClick : function (event) {
    this.props.onTrigger(event);
  },

  render : function () {
    return <button className="add" onClick={this.onClick}><span className="fa fa-expand"></span></button>
  }
});

module.exports = ExpandButton;