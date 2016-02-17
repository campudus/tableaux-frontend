import React from 'react';
import AmpersandMixin from'ampersand-react-mixin';
import ActionCreator from'../../actions/ActionCreator';
import {translate} from 'react-i18next/lib';

//TODO: Ajax spinner when adding row
var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    table : React.PropTypes.object.isRequired
  },

  addRow : function () {
    var tableId = this.props.table.getId();
    ActionCreator.addRow(tableId);
  },

  render : function () {
    var t = this.props.t;
    return (
      <div className="new-row">
        <div className="new-row-inner" onClick={this.addRow}>
          <i className="fa fa-plus-circle">
          </i>
          <span>{t('add_new_row')}</span>
        </div>
      </div>
    );
  }
});

module.exports = translate(['table'])(NewRow);
