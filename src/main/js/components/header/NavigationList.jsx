var React = require('react');

var NavigationList = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    return (

      <nav id="main-navigation-wrapper" className="NOTactive">
        <a id="burger" href="#">
          <i className="fa fa-bars"></i>
        </a>
        <div id="main-navigation">
          <div id="logo">
            <img src="/img/logo.png" alt=""/>
          </div>
          <ul id="main-navigation-list">
            <li><a href={ "/" + this.props.langtag + "/table" }><i className="fa fa-columns"></i>Tables</a></li>
            <li><a href={ "/" + this.props.langtag + "/media" }><i className="fa fa-file"></i>Media</a></li>
            <li><a href="#"><i className="fa fa-cog"></i>Settings</a></li>
            <li><a href="#"><i className="fa fa-life-ring"></i>Help</a></li>
          </ul>
        </div>
      </nav>
    )
  }
});

module.exports = NavigationList;