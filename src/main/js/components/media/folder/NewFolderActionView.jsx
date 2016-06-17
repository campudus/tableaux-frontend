var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
import {translate} from 'react-i18next';

var NewFolderActionView = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    callback : React.PropTypes.func.isRequired
  },

  render : function () {

    const {t} = this.props;

    return (
      <div className="new-folder-button" onClick={this.props.callback}>
        <i className="icon fa fa-plus"></i><span>{t('create_new_folder')}</span>
      </div>
    );
  }
});

module.exports = translate(['media'])(NewFolderActionView);
