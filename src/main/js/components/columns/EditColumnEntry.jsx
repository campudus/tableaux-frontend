import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'
import ActionCreator from '../../actions/ActionCreator'
import OutsideClick from 'react-onclickoutside'
import KeyboardShortcutHelper from '../../helpers/KeyboardShortcutsHelper'


const EditColumnEntry = React.createClass({
  mixins: [AmpersandMixin, OutsideClick],

  PropTypes: {
    name: React.PropTypes.string.isRequired,
    index: React.PropTypes.number.isRequired,
    langtag: React.PropTypes.string.isRequired,
    blurHandler: React.PropTypes.func.isRequired
  },

  handleClickOutside(evt) {
    this.props.blurHandler(evt)
  },

  getKeyboardShortcuts() {
    return {
      escape: (event) => {
        this.blurHandler(event)
      },
      enter: (event) => {
        this.blurHandler(event)
      },
      always: (event) => {
        event.stopPropagation()
      }
    }
  },

  render() {
    const {name,index,langtag,blurHandler} = this.props
    console.log("EditColumnEntry", index, "blurHandler:", blurHandler)
    return (
        <div className="column-head column-head-edit">
          <textarea autoFocus className="input"
                    name={"col-"+index}
                    defaultValue={name}
                    onBlur={blurHandler}
                    onKeyDown={KeyboardShortcutHelper.onKeyboardShortcut(this.getKeyboardShortcuts())} />
        </div>
    )
  }
})

module.exports = EditColumnEntry