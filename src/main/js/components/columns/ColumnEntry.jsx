import React from "react";
import AmpersandMixin from "ampersand-react-mixin";
import ActionCreator from "../../actions/ActionCreator";
import OutsideClick from "react-onclickoutside";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import i18n from "i18next";
import * as AccessControl from "../../helpers/accessManagementHelper";

const ColumnEntry = React.createClass({
  mixins: [AmpersandMixin, OutsideClick],

  PropTypes: {
    description: React.PropTypes.string.isRequired,
    columnContent: React.PropTypes.array.isRequired,
    index: React.PropTypes.number.isRequired,
    selected: React.PropTypes.number.isRequired,
    clickHandler: React.PropTypes.func.isRequired,
    cancelEdit: React.PropTypes.func.isRequired,
    langtag: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    readOnly: React.PropTypes.bool
  },

  handleClickOutside(evt) {
    this.props.blurHandler()
  },

  getInitialState() {
    return {
      name: this.props.name,
      description: this.props.description
    }
  },

  handleClick() {
    //only admin may modify columns
    if (!AccessControl.isUserAdmin()) {
      return
    }

    const {index, selected} = this.props
    const letParentHandleClick = this.props.clickHandler
    if (index === selected) {
      this.editColumn()
    } else {
      letParentHandleClick()
    }
  },

  // implicit currying so ColumnEditorOverlay events may pass values easily
  handleInput(inputState) {
    this.setState(inputState)
  },

  cancelEdit() {
    ActionCreator.closeOverlay()
  },

  saveEdit() {
    const {langtag, index} = this.props
    const {name, description} = this.state
    const new_name = (name != this.props.name) ? name : null
    const new_desc = (description != this.props.description) ? description : null
    ActionCreator.editColumnHeaderDone(index, langtag, new_name, new_desc)
    ActionCreator.closeOverlay()
  },

  editColumn() {
    if (this.props.readOnly) {
      return
    } // guardian for links and ID-Name
    const {name, description, index} = this.props
    this.setState(this.getInitialState())
    ActionCreator.openOverlay({
      head: <text>{i18n.t('table:editor.edit_column')}</text>,
      body: <ColumnEditorOverlay name={name}
                                 handleInput={this.handleInput.bind(this)}
                                 description={description}
                                 index={index} />,
      footer: <div id="column-editor-footer">
        <a href="#" className="button" onClick={this.cancelEdit}>
          {i18n.t('common:cancel')}
        </a>
        <a href="#" className="button" onClick={this.saveEdit}>
          {i18n.t('common:save')}
        </a>
      </div>,
      closeOnBackgoundClicked: true,
      type: "flexible"
    })
  },

  render() {
    const {index, columnContent, columnIcon, selected} = this.props

    const css_class = (index === selected) ? "column-head column-selected" : "column-head"
    return (
      <div className={css_class}
           key={index}
           onClick={this.handleClick}>
        {columnContent}
        {columnIcon}
      </div>
    )
  }
})

module.exports = ColumnEntry