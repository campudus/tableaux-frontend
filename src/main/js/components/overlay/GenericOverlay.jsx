var React = require('react');
var ReactDOM = require('react-dom');
var Dispatcher = require('../../dispatcher/Dispatcher');

var GenericOverlay = React.createClass({

  propTypes : {
    body : React.PropTypes.element.isRequired,
    head : React.PropTypes.element,
    type : React.PropTypes.string
  },

  allowedTypes : ["flexible", "normal"],

  componentWillMount : function () {

  },

  componentDidMount : function () {
    //TODO: Focus Textarea when mounted
    console.log("genericOverlay mounted. ", this.props.type);
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    //document.addEventListener('click', this.onMouseClick, true);
    document.addEventListener('mousedown', this.onMouseClick, true);

    //http://stackoverflow.com/questions/2520650/how-do-you-clear-the-focus-in-javascript
    //if (document.activeElement != document.body) document.activeElement.blur();
  },

  componentWillUnmount : function () {
    //Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
    //document.removeEventListener('click', this.onMouseClick, true);
    document.removeEventListener('mousedown', this.onMouseClick, true);
  },

  onMouseClick : function (event) {
    //disable any mouse events from the table
    event.stopPropagation();
  },

  onKeyboardShortcut : function (event) {
    event.stopPropagation();
    //Prevents from tabbing around while overlay is open
    if (!ReactDOM.findDOMNode(this).contains(document.activeElement)) {
      console.log("focus is outside");
      event.preventDefault();
    }

  },

  render : function () {
    var overlayType = this.props.type || "normal"; //default to normal
    var overlayWrapperClass = "open " + overlayType;

    if (this.allowedTypes.indexOf(overlayType) === -1) {
      console.error("GenericOverlay type is not valid! Given type is:", overlayType, "Check GenericOverlay.");
      return null;
    }

    return (
      <div id="overlay" className={overlayWrapperClass}>
        <div id="overlay-wrapper">
          <h2>{this.props.head}</h2>
          <div className="content-scroll">
            <div id="overlay-content">
              {this.props.body}
            </div>
          </div>
        </div>
        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  }
});

module.exports = GenericOverlay;
