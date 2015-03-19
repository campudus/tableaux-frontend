var React = require('react');

var tableaux = [
  [{kind : 'number', content : 11}, {kind : 'number', content : 12}, {kind : 'string', content : 'a'}],
  [{kind : 'number', content : 21}, {kind : 'number', content : 22}, {kind : 'string', content : 'b'}],
  [{kind : 'number', content : 31}, {kind : 'number', content : 32}, {kind : 'string', content : 'c'}],
  [{kind : 'number', content : 41}, {kind : 'number', content : 42}, {kind : 'string', content : 'd'}]
];


module.exports = {
  data : tableaux,
  reactType : React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.shape({
    kind : React.PropTypes.string.isRequired,
    content : React.PropTypes.any
  }))).isRequired
};
