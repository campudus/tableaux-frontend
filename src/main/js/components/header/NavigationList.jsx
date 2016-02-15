var React = require('react');
var OutsideClick = require('react-onclickoutside');
var translate = require('react-i18next/lib').translate;

var NavigationList = React.createClass({

  mixins : [OutsideClick],

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      navigationOpen : false
    };
  },

  handleClickOutside : function (event) {
    this.setState({navigationOpen : false});
  },

  mainNavButtonClicked : function (e) {
    e.preventDefault();
    this.setState({navigationOpen : !this.state.navigationOpen});
  },

  //TODO: active class for current page
  render : function () {
    var mainNavigation;
    var t = this.props.t;
    if (this.state.navigationOpen) {
      mainNavigation = <div id="main-navigation">
        <div id="logo">
          <h1>DataCenter</h1>
        </div>
        <ul id="main-navigation-list">
          <li><a href={ "/" + this.props.langtag + "/table" }><i className="fa fa-columns"></i>{t('header:menu.tables')}</a></li>
          <li><a href={ "/" + this.props.langtag + "/media" }><i className="fa fa-file"></i>{t('header:menu.media')}</a></li>
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
});

module.exports = translate(['header'])(NavigationList);