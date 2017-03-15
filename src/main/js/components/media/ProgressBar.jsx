var React = require("react");

var ProgressBar = React.createClass({

  propTypes: {
    progress: React.PropTypes.number.isRequired
  },

  render: function () {
    var completed = this.props.progress;
    if (completed < 0) {
      completed = 0;
    }
    if (completed > 100) {
      completed = 100;
    }

    var style = {
      width: completed + "%",
      transition: "width 100ms"
    };

    return (
      <div className="progressbar-container">
        <div className="progressbar-progress" style={style}>{completed + "%"}</div>
      </div>
    );
  }
});

module.exports = ProgressBar;
