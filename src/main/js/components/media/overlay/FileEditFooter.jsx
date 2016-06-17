var React = require('react');
var App = require('ampersand-app');
import {translate} from 'react-i18next';

var FileEditFooter = React.createClass({

  propTypes : {
    onSave : React.PropTypes.func.isRequired,
    onCancel : React.PropTypes.func.isRequired
  },

  render : function () {
    const {t} = this.props;
    return (
      <div className="button-wrapper">
        <button className="button positive" onClick={this.props.onSave}>{t('file_edit_save')}</button>
        <button className="button neutral" onClick={this.props.onCancel}>{t('file_edit_cancel')}</button>
      </div>
    );
  }
});

module.exports = translate(['media'])(FileEditFooter);
