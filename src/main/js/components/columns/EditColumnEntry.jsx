import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'
import OutsideClick from 'react-onclickoutside'
import KeyboardShortcutHelper from '../../helpers/KeyboardShortcutsHelper'


const EditColumnEntry = React.createClass({
  mixins: [AmpersandMixin, OutsideClick],

  getInitialState() {
    return {
      value: this.props.name
    }
  },

  PropTypes: {
    name: React.PropTypes.string.isRequired,
    index: React.PropTypes.number.isRequired,
    langtag: React.PropTypes.string.isRequired,
    cancelEdit: React.PropTypes.func.isRequired,
    saveEdit: React.PropTypes.func.isRequired
  },

  handleClickOutside(evt) {
    this.props.saveEdit()(this.state.value)
  },

  getKeyboardShortcuts() {
    return {
      escape: (event) => {
        this.cancelEdit()
        event.stopPropagation()
      },
      enter: (event) => {
        this.saveEdit()(this.state.value)
        event.stopPropagation()
      },
      left: (event) => {
        event.stopPropagation()
      },
      right: (event) => {
        event.stopPropagation()
      },
      always: (event) => {
        event.stopPropagation()
      }
    }
  },

  handleChange(evt) {
    if (evt && evt.target) {
      this.setState({value: evt.target.value})
    }
  },

  render() {
    const {name,index,langtag,cancelEdit,saveEdit} = this.props
    const {value} = this.state
    console.log(value)
    return (
        <div className="column-head column-head-edit">
          <input type="text" autoFocus className="input"
                 name={"col-"+index}
                 onBlur={saveEdit(value)}
                 value={value}
                 onKeyDown={KeyboardShortcutHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
                 onChange={this.handleChange} />
        </div>
    )
  }
})

module.exports = EditColumnEntry