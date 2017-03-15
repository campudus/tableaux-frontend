var React = require("react");
var ReactDOM = require("react-dom");
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class SubfolderEdit extends React.Component {
  static propTypes = {
    folder: React.PropTypes.object.isRequired,
    onSave: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired
  };

  handleClickOutside = (event) => {
    this.onSave();
  };

  getKeyboardShortcuts = () => {
    const {onCancel} = this.props;
    return {
      escape: (event) => {
        event.preventDefault();
        onCancel();
      },
      tab: (event) => {
        event.preventDefault();
        this.onSave();
      },
      enter: (event) => {
        event.preventDefault();
        this.onSave();
      }
    };
  };

  componentDidMount() {
    var domNode = ReactDOM.findDOMNode(this.refs.nameInput);
    domNode.focus();
    domNode.select();
  }

  onSave = () => {
    const currentName = this.refs.nameInput.value.toString().trim();
    const placeHolderName = this.props.folder.name;
    if (currentName === "" || currentName === placeHolderName) {
      this.props.onCancel();
    } else {
      this.props.onSave(this.props.folder.id, currentName, this.props.folder.description, this.props.folder.parent);
    }
  };

  render() {
    const placeHolderName = this.props.folder.name;

    return (
      <div className="create-new-folder">
        <i className="icon fa fa-folder-open"></i>
        <input ref="nameInput" type="text" defaultValue={placeHolderName}
               onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}/>
      </div>
    );
  }
}

export default SubfolderEdit;
