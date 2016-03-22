import React from 'react';
import {translate} from 'react-i18next';

let NavigationPopup = (props) => {
  const {langtag, t} = props;
  return (
    <div id="main-navigation">
      <div id="logo">
        <h1>DataCenter</h1>
      </div>
      <ul id="main-navigation-list">
        <li><a href={ "/" + langtag + "/table" }><i className="fa fa-columns"></i>{t('header:menu.tables')}
        </a></li>
        <li><a href={ "/" + langtag + "/media" }><i className="fa fa-file"></i>{t('header:menu.media')}</a>
        </li>
      </ul>
    </div>
  );
};

NavigationPopup.propTypes = {
  langtag : React.PropTypes.string.isRequired
};

export default translate(['header'])(NavigationPopup);