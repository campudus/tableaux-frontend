var React = require('react');
var ReactDOM = require('react-dom');
var AmpersandMixin = require('ampersand-react-mixin');

var SubfolderEdit = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'SubfolderEdit',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    callback : React.PropTypes.func.isRequired
  },

  componentDidMount(){
    var domNode = ReactDOM.findDOMNode(this.refs.nameInput);
    domNode.focus();
    domNode.select();
  },

  onSave : function (event) {
    //if key was enter
    if (event.keyCode == 13) {
      var newName = event.target.value;
      if (newName == "") {
        this.props.callback(false);
        return;
      }

      var folder = this.props.folder;
      folder.name = newName;

      this.props.callback(folder);
    } else if (event.keyCode == 27) {
      this.props.callback(false);
    }
  },

  render : function () {
    var name = this.props.folder.name;

    return (
      <div>
        <i className="icon fa fa-folder-open"></i><input ref="nameInput" type="text" defaultValue={name}
                                                         onKeyDown={this.onSave}/>
      </div>
    );
  }
});

module.exports = SubfolderEdit;
