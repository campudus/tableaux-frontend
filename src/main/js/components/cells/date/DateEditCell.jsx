/*
 * Allows to edit value of a DateCell in a Datetime date picker (react-datetime)
 */
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import ActionCreator from "../../../actions/ActionCreator";
import Datetime from "react-datetime";

@listensToClickOutside
class DateEditCell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      moment: this.props.value
    };
  }

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts);
  };

  componentWillUnmount = () => {
    this.props.setCellKeyboardShortcuts({});
  };

  handleClickOutside = () => {
    this.props.handleEditFinished(this.props.OPTIONS.SAVE);
    ActionCreator.toggleCellEditing(false);
  };

  handleClickClearDate = event => {
    this.handleChange(null);
    this.props.handleEditFinished(this.props.OPTIONS.CLEAR);
    ActionCreator.toggleCellEditing("CLEAR");
    event.preventDefault();
    event.stopPropagation();
  };

  handleChange = moment => {
    this.setState({moment});
    this.props.handleDateUpdate(moment);
  };

  getKeyboardShortcuts = () => {
    const OPTIONS = this.props.OPTIONS;
    const editFinished = this.props.handleEditFinished;
    return {
      tab: function () {
        editFinished(OPTIONS.SAVE);
        ActionCreator.toggleCellEditing(true);
        ActionCreator.selectNextCell(Directions.RIGHT);
      },
      enter: function () {
        editFinished(OPTIONS.SAVE);
        ActionCreator.toggleCellEditing(false);
        ActionCreator.selectNextCell(Directions.DOWN);
      },
      escape: function (event) {
        event.preventDefault();
        event.stopPropagation();
        editFinished(OPTIONS.SAVE);
        ActionCreator.toggleCellEditing(false);
      },
      always: function (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
  };

  render = () => {
    const {moment} = this.state;
    return (
      <div className="cell-content">
        {this.props.toDisplayValue(moment)}
        <i className="fa fa-ban cell-content" style={{float: "right"}}
           onClick={this.handleClickClearDate} />
        <Datetime onChange={this.handleChange}
                  open={true}
                  input={false}
                  value={moment}
                  timeFormat={false} />
      </div>
    )
  }
}

DateEditCell.propTypes = {
  setCellKeyboardShortcuts: React.PropTypes.func.isRequired,
  handleDateUpdate: React.PropTypes.func.isRequired,
  toDisplayValue: React.PropTypes.func.isRequired,
  handleEditFinished: React.PropTypes.func.isRequired,
  cell: React.PropTypes.object.isRequired,
  value: React.PropTypes.object.isRequired
};

module.exports = DateEditCell;