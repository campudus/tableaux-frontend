var React = require('react');
var ReactDOM = require('react-dom');
var OutsideClick = require('react-onclickoutside');

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
    if (this.state.navigationOpen) {
      mainNavigation = <div id="main-navigation">
        <div id="logo">
          <img src="/img/logo.png" alt=""/>
        </div>
        <ul id="main-navigation-list">
          <li><a href={ "/" + this.props.langtag + "/table" }><i className="fa fa-columns"></i>Tables</a></li>
          <li><a href={ "/" + this.props.langtag + "/media" }><i className="fa fa-file"></i>Media</a></li>
          <li><a href="#"><i className="fa fa-cog"></i>Settings</a></li>
          <li><a href="#"><i className="fa fa-life-ring"></i>Help</a></li>
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

module.exports = NavigationList;