var React = require('react');

var Cell = React.createClass({

  getInitialState : function () {
    return {isAdding : false};
  },

  addLink : function () {
    console.log('adding link...');
    this.setState({isAdding : true});
  },

  searchLink : function (e, b) {
    console.log('pressed key', e, b, arguments);
    var x = this.refs.searchLink.getDOMNode().value;
    console.log('x=',x);
    if (e.keyCode == 13) {
      this.setState({isAdding : false});
    }
  },

  render : function () {
    var self = this;
    if (this.state.isAdding) {
      return <span className="add"><input type="text" ref="searchLink" onKeyUp={self.searchLink}/></span>;
    } else {
      return <span className="add" onClick={self.addLink}>+</span>;
    }
  }

});

module.exports = Cell;
