var React = require('react');

var Settings = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    return (
      <div id="settings">
        <div id="settings-content">
          <ul>
            <li><i className="fa fa-table icon"></i><a href={ "/" + this.props.langtag + "/table" }>Tables</a></li>
            <li><i className="fa fa-file-image-o icon"></i><a href="/media">Media</a></li>
          </ul>
        </div>
      </div>
    )
  }
});

module.exports = Settings;