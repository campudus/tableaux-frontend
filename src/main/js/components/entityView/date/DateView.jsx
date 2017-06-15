import React, {Component, PropTypes} from "react";
import Moment from "moment";
import {DateFormats, DateTimeFormats} from "../../../constants/TableauxConstants";
import Datetime from "react-datetime";
import listensToClickOutside from "react-onclickoutside";
import i18n from "i18next";
import {changeCell} from "../../../models/Tables";
import classNames from "classnames";
import * as f from "lodash/fp";
import {contentChanged} from "../../cells/Cell";

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
    time: PropTypes.bool,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  handleClickOutside = () => {
    if (this.state.editing) {
      this.saveEditsAndClose(this.state.moment);
    }
  };

  getValue = () => {
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
    } else if (!this.props.thisUserCantEdit) {
      this.setState({editing});
    }
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      (fn || function () {})();
    };

    return {
      escape: captureEventAnd(this.setEditing(false)),
      enter: captureEventAnd(this.saveEditsAndClose)
    };
  };

  saveEditsAndClose = moment => {
    this.saveMoment(moment);
    this.setEditing(false)();
  };

  saveMoment = moment => {
    const oldValue = this.getValue();
    const value = (moment)
      ? ((moment.isValid()) ? moment : Moment()).format(this.Formats.formatForServer)
      : null;
    const {cell, langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {[langtag]: value}
      : value;
    changeCell({cell, value: changes})
      .then(() => contentChanged(cell, langtag, oldValue));
  };

  handleChange = moment => {
    this.saveMoment(moment);
    this.setState({moment});
  };

  openOnEnter = event => {
    if (event.key === "Enter") {
      event.stopPropagation();
      event.preventDefault();
      this.setEditing(true)();
    }
  };

  render() {
    const {editing} = this.state;
    const {funcs, thisUserCantEdit} = this.props;
    const value = (editing)
      ? this.stringFromMoment(this.state.moment)
      : this.stringFromMoment(this.getValue());
    const cssClass = classNames("item-content datetime", {"disabled": thisUserCantEdit});
    return (
      <div className={cssClass}
           onClick={this.setEditing(true)}
           tabIndex={1}
           onKeyDown={this.openOnEnter}
           ref={el => { funcs.register(el); }}
      >
        <div className="content-wrapper">{
          (value)
            ? (<div className="content">
              <div><i className="fa fa-calendar"/><span>{f.first(value.split(" - "))}</span></div>
              {(this.props.time)
                ? <div><i className="fa fa-clock-o"/><span>{f.last(value.split(" - "))}</span></div>
                : null
              }
            </div>
          )
            : i18n.t("table:empty.date")
        }</div>
        {(editing && !thisUserCantEdit)
          ? (
            <div className="datetime-popup">
              <Datetime onBlur={this.saveEditsAndClose}
                        onChange={this.handleChange}
                        value={this.state.moment || Moment()}
                        input={false}
              />
              <div className="clear-datetime" onClick={() => this.handleChange(null)}>
                <i className="fa fa-ban"/>
                <span>{i18n.t("table:clear-date")}</span>
              </div>
            </div>
          )
          : null
        }
        {this.props.children}
      </div>
    );
  }
}

export default DateView;
