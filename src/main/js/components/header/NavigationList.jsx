var React = require('react');
var ReactDOM = require('react-dom');

var NavigationList = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      navigationOpen : false
    };
  },

  clickedOutside : function (e) {
    //clicked outside
    if (!ReactDOM.findDOMNode(this).contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      this.setState({navigationOpen : false});
    }
  },

  componentWillUnmount : function () {
    document.removeEventListener('click', this.clickedOutside, false);
  },

  mainNavButtonClicked : function (e) {
    e.preventDefault();
    this.setState({navigationOpen : !this.state.navigationOpen});
  },

  toggleEvents : function () {
    if (this.state.navigationOpen) {
      document.addEventListener('click', this.clickedOutside, false);
    } else {
      document.removeEventListener('click', this.clickedOutside, false);
    }
  },


  //TODO: active class for current page
  render : function () {
    var mainNavigation;
    this.toggleEvents();
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