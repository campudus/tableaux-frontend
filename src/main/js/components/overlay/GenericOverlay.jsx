var React = require('react');
var ReactDOM = require('react-dom');
var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var GenericOverlay = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    body : React.PropTypes.element.isRequired,
    head : React.PropTypes.element,
    type : React.PropTypes.string,
    closeOnBackgroundClicked : React.PropTypes.bool
  },

  getDefaultProps : function () {
    return {
      closeOnBackgroundClicked : true
    };
  },

  allowedTypes : ["flexible", "normal"],

  componentDidMount : function () {
    //TODO: Focus Textarea when mounted
    console.log("genericOverlay mounted. ", this.props.type);
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    document.addEventListener('mousedown', this.onMouseClick, true);
  },

  componentWillUnmount : function () {
    //Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
    document.removeEventListener('mousedown', this.onMouseClick, true);
  },

  onMouseClick : function (event) {
    //disable any mouse events from the table
    event.stopPropagation();

    if (this.props.closeOnBackgroundClicked && (event.target === this.refs.overlayBackground)) {
      Dispatcher.trigger("close-overlay");
    }
  },


  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      escape : function (event) {
        event.preventDefault();
        Dispatcher.trigger("close-overlay");
      },

      always : function (event, shortcutFound) {
        console.log("in always. ShortcutFound: ", shortcutFound);
        //Prevents any underlying handlers
        event.stopPropagation();
        //Prevents from tabbing around underneath the overlay while overlay is open
        if (!shortcutFound && !ReactDOM.findDOMNode(self).contains(document.activeElement)) {
          //TODO should clear the activeElement
          console.log("focus is outside");
          event.preventDefault();
        }
      }
    };
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
        <div ref="overlayBackground" onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  }
});

module.exports = GenericOverlay;
