import React from "react";
import RichTextComponent from "../../RichTextComponent";

class TextView extends React.Component {

  constructor(props) {
    super(props);
    this.displayName = "TextView";
    this.state = {editing: false};
  }

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
  };

  getValue = () => {
    const cell = this.props.cell;
    const value = (cell.isMultiLanguage)
      ? cell.value[this.props.langtag]
      : cell.value;
    return value || "";
  };

  setEditing = editing => () => {
    this.setState({editing: editing});
  };

  saveAndClose = (newValue) => {
    const {cell,langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: newValue}}
      : {value: newValue};
    cell.save(changes, {patch: true});
    this.setEditing(false)();
  };

  render() {
    const value = this.getValue();
    const {editing} = this.state;
    const {langtag} = this.props;

    return (editing)
      ? (
        <RichTextComponent value={value}
                           className="view-content view-text"
                           close={this.setEditing(false)}
                           saveAndClose={this.saveAndClose}
                           langtag={langtag}
        />
      )
      : (
        <RichTextComponent value={value}
                           className="view-content view-text"
                           langtag={langtag}
                           readOnly={true}
                           onClick={this.setEditing(true)} />
      );
  }
}

export default TextView;