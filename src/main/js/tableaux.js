var React = require('react');
var $ = require('jQuery');

var tableaux = {
  columns : [
    {id : 1, name : 'first-column', kind : 'number'},
    {id : 2, name : 'second column', kind : 'number'},
    {id : 3, name : 'third col', kind : 'string'}
  ],
  rows : [
    [11, 12, 'a'],
    [21, 22, 'b'],
    [31, 32, 'c'],
    [41, 42, 'd']
  ]
};

console.log('getting /tables');
//$.getJSON('http://localhost:8181/tables')
//  .done(function(result) {
//    console.log('result of /tables:');
//    console.log(result);
//  });

function get(row, column) {
  console.log('get(' + row + ',' + column + ')');
  return tableaux.rows[row][column];
}

function put(row, column, value) {
  tableaux.rows[row][column] = value;
}

function getColumns() {
  return tableaux.columns.map(function (elem) {
    return {
      kind : elem.kind,
      id : elem.id
    };
  });
}

module.exports = {
  get : get,
  put : put,
  getColumns : getColumns
};
