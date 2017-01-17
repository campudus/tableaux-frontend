import React from 'react'
import i18n from 'i18next'
import AmpersAndMixin from 'ampersand-react-mixin'
import TableauxConstants from '../../../constants/TableauxConstants'
import * as R from 'ramda'

class NameEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = { active: false, name: null }
  }

  mixins = [AmpersAndMixin]

  startEditing = (evt) => {
    this.setState({ active: true, name: this.getTableDisplayName() })
    evt.stopPropagation()
  }

  handleInput = (evt) => {
    if (evt && evt.key) {
      const saveAndClose = R.compose(this.saveTableName, this.stopEditing)
      R.cond([
          [R.equals('Enter'), saveAndClose],
          [R.equals('Escape'), this.stopEditing],
          [R.T, x => null]
      ])(evt.key)
    }
  }

  getTableDisplayName = () => {
    const {table:{displayName,name},langtag} = this.props
    return displayName[langtag] || displayName[TableauxConstants.FallbackLanguage] || name
  }

  handleTextChange = (evt) => {
    if (evt && evt.target) {
      this.setState({ name: evt.target.value })
    }
  }

  stopEditing = () => {
    this.setState({ active: false })
  }

  saveTableName = () => {
    const {name} = this.state
    if (this.getTableDisplayName() === name) return //guardian

    const {table, langtag} = this.props
    const patchObj = R.assocPath(["displayName", langtag], name, {})
    table.save(patchObj, { patch: true })
  }

  renderOpenInput = () => {
    return (
        <input type="text" className="input" autoFocus
               onChange={this.handleTextChange}
               onKeyDown={this.handleInput}
               value={this.state.name}
               onBlur={R.compose(this.saveTableName, this.stopEditing)}
        />
    )
  }

  handleClickOutside = () => {
    console.log("NameEditor.handleClickOutside")
    R.compose(this.saveTableName, this.stopEditing)()
  }

  render = () => {
    const {active} = this.state
    if (active) {
      return this.renderOpenInput()
    } else {
      return (
          <div id="table-rename" className={active ? "active" : ""}
               onClick={this.startEditing} >
            {i18n.t("table:editor.rename_table")}
            {(active) ? this.renderInput() : null}
          </div>
      )
    }

  }
}

NameEditor.propTypes = {
  table: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired
}

module.exports = NameEditor