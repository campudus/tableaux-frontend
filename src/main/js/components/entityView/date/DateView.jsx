import React, {Component, PropTypes} from "react";
import Moment from "moment";
import {DateFormats, DateTimeFormats} from "../../../constants/TableauxConstants";
import Datetime from "react-datetime";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class DateView extends Component {

  constructor(props) {
    super(props);
    this.displayName = (props.time) ? "DateTimeView" : "DateView";
    this.state = {editing: false};
    this.Formats = (props.time) ? DateTimeFormats : DateFormats;
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    time: PropTypes.bool
  };

  handleClickOutside = () => {
    if (this.state.editing) {
      this.saveEditsAndClose(this.state.moment);
    }
  };

  getValue =  () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    return this.momentFromString(value);
  };

  stringFromMoment = moment => {
    return (moment && moment.isValid())
      ? moment.format(this.Formats.formatForUser)
      : "";
  };

  momentFromString = string => {
    const moment = Moment(string, this.Formats.formatForServer, true);
    return (moment.isValid()) ? moment : null;
  };

  setEditing = editing => () => {
    if (editing) {
      this.setState({
        moment: this.momentFromString(this.getValue()),
        editing
      });
    } else {
      this.setState({editing});
    }
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      (fn || function(){})();
    };

    return {
      escape: captureEventAnd(this.setEditing(false)),
      enter: captureEventAnd(this.saveEditsAndClose)
    }
  };

  saveEditsAndClose = moment => {
    this.saveMoment(moment);
    this.setEditing(false)();
  };

  saveMoment = moment => {
    const value = ((moment && moment.isValid()) ? moment : Moment()).format(this.Formats.formatForServer);
    const {cell, langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: value}}
      : {value};
    cell.save(changes, {patch: true});
  };

  handleChange = moment => {
    this.saveMoment(moment);
    this.setState({moment});
  };

  render() {
    const {editing} = this.state;
    const value = (editing)
      ? this.stringFromMoment(this.state.moment)
      : this.stringFromMoment(this.getValue());
    return (
      <div className="view-content view-datetime"
           onClick={this.setEditing(true)}
      >
        {value}
        {(editing)
          ? <Datetime onBlur={this.saveEditsAndClose}
                      onChange={this.handleChange}
                      value={this.state.moment || Moment()}
                      input={false}
          />
          : null
        }
      </div>
    )
  }
}

export default DateView;
