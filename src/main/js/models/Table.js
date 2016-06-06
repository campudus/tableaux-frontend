import Model from 'ampersand-model';
import Columns from './Columns';
import Rows from './Rows';

const Table = Model.extend({
  props : {
    id : 'number',
    name : 'string',
    displayName : 'object',
    description : 'object'
  },

  collections : {
    columns : Columns,
    rows : Rows
  },

  initialize() {
  }

});

module.exports = Table;
