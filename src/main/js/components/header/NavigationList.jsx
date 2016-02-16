import React from 'react';
import listensToClickOutside from 'react-onclickoutside/decorator';
import {translate} from 'react-i18next/lib';

@translate(['header'])
@listensToClickOutside()
class NavigationList extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired
  };

  state = {
    navigationOpen : false
  };

  handleClickOutside = (event) => {
    this.setState({navigationOpen : false});
  };

  mainNavButtonClicked = (e) => {
    e.preventDefault();
    this.setState({navigationOpen : !this.state.navigationOpen});
  };

  //TODO: active class for current page
  render() {
    let mainNavigation;
    let {t} = this.props;
    if (this.state.navigationOpen) {
      mainNavigation = <div id="main-navigation">
        <div id="logo">
          <h1>DataCenter</h1>
        </div>
        <ul id="main-navigation-list">
          <li><a href={ "/" + this.props.langtag + "/table" }><i className="fa fa-columns"></i>{t('header:menu.tables')}
          </a></li>
          <li><a href={ "/" + this.props.langtag + "/media" }><i className="fa fa-file"></i>{t('header:menu.media')}</a>
          </li>
        </ul>
      </div>;
    }
    return (
      <nav id="main-navigation-wrapper" className={this.state.navigationOpen ? "active": ""}>
        <a id="burger" href="#" onClick={this.mainNavButtonClicked}>
          <i className="fa fa-bars"></i>
        </a>
        {mainNavigation}
      </nav>
    )
  }
}

export default NavigationList;