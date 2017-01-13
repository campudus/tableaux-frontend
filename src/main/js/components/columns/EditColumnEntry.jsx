import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'
import ActionCreator from '../../actions/ActionCreator'
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
    cancelEdit: React.PropTypes.func.isRequired
  },

  handleClickOutside(evt) {
    this.props.cancelEdit(evt)
  },

  getKeyboardShortcuts() {
    return {
      escape: (event) => {
        this.cancelEdit(event)
      },
      enter: (event) => {
        this.cancelEdit(event)
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
    const {name,index,langtag,cancelEdit} = this.props
    return (
        <div className="column-head column-head-edit">
          <input type="text" autoFocus className="input"
                 name={"col-"+index}
                 defaultValue={name}
                 onBlur={cancelEdit}
                 value={this.state.value}
                 //onKeyDown={KeyboardShortcutHelper.onKeyboardShortcut(this.getKeyboardShortcuts())}
                 onChange={this.handleChange(this.state.value)} />
        </div>
    )
  }
})

module.exports = EditColumnEntry