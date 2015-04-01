var $ = require('jQuery');

var currentTable = {
  columns : [
    {id : 0, name : 'first-column', kind : 'number'},
    {id : 1, name : 'second column', kind : 'number'},
    {id : 2, name : 'third col', kind : 'string'}
  ],
  rows : [
    [11, 12, 'a'],
    [21, 22, 'b'],
    [31, 32, 'c'],
    [41, 42, 'd']
  ]
};

var tables = [];
var loaded = false;
var waitingForLoadEvent = [];
var currentTableId = 0;

$.getJSON('/api/tables')
  .done(function (result) {
    console.log('read /api/tables');
    tables = result.tables;
    console.log(tables);
    switchTable(tables[0].id, doneLoading);
  })
  .error(function (err) {
    console.log('got an error getting api stuff:');
    console.log(err);
  });

var tableaux = {
  get : get,
  put : put,
  getColumns : getColumns,
  getTables : getTables,
  getCurrentTable : getCurrentTable,
  switchTable : switchTable,
  onLoadRegister : onLoadRegister
};

function switchTable(id, done, status) {
  console.log('switching to table ' + id);
  $.getJSON('/api/tables/' + id)
    .done(function (table) {
      console.log('switching table to');
      console.log(table);
      currentTable = table;
      currentTableId = id;
      done();
    })
    .error(function (err) {
      console.log('error!');
      console.log(err);
      status({error : true, message : err});
    });
}

function get(row, column) {
  console.log('get(' + row + ',' + column + ')');
  console.log('currentTable:');
  console.log(currentTable);
  var rows = currentTable.rows.filter(function (r) {
    return r.id === row;
  })[0];
  return rows.values[column];
}

function put(row, column, value, callback) {
  var theRow = currentTable.rows.filter(function (r) {
    return r.id === row;
  })[0];
  theRow.values[column] = value;
  $.ajax({
    url : '/api/tables/' + currentTableId + '',
    data : {
      cells : [
        {
          column : {id : column},
          row : {id : row},
          value : value
        }
      ]
    }, dataType : 'json'
  })
    .done(function (res) {
      console.log('got a result when posting table');
      console.log(res);
      if (res.status === 'ok') {
        callback({error : false, message : 'Saved'});
      } else {
        callback({error : true, message : res.message});
      }
    })
    .error(function (err) {
      console.log('error posting data');
      console.log(err);
      callback({error : true, message : err});
    });
}

function getColumns() {
  return currentTable.columns.map(function (elem) {
    return {
      kind : elem.kind,
      id : elem.id
    };
  });
}

function getTables() {
  return tables;
}

function doneLoading() {
  loaded = true;
  waitingForLoadEvent.forEach(function (fn) {
    console.log('calling queued loading function');
    fn();
  });
  waitingForLoadEvent = [];
}

function onLoadRegister(fn) {
  console.log('registering function for load event');
  console.log(fn);
  if (loaded) {
    fn();
  } else {
    waitingForLoadEvent.push(fn);
  }
}

function getCurrentTable() {
  return currentTable;
}

module.exports = tableaux;
