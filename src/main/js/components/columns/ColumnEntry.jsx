import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'
import EditColumnEntry from './EditColumnEntry'
import TableauxConstants from '../../constants/TableauxConstants'
import ActionCreator from '../../actions/ActionCreator'

const ActionTypes = TableauxConstants.ActionTypes

const ColumnEntry = React.createClass({
  mixins: [AmpersandMixin],

  PropTypes: {
    columnContent: React.PropTypes.array.isRequired,
    index: React.PropTypes.number.isRequired,
    edit: React.PropTypes.number.isRequired,
    selected: React.PropTypes.number.isRequired,
    clickHandler: React.PropTypes.func.isRequired,
    langtag: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired
  },

  cancelEdit() {
    const {index,langtag} = this.props
    console.log("ColumnEntry.cancelEdit")
    ActionCreator.editColumnHeaderDone(null, index, langtag, null)
    console.log("Canceled editing column", this.props.name)
  },

  //curried, so child can pass value
  saveEdit() {
    const self = this
    return newVal => {
      console.log("ColumnEntry.saveEdit.closure", newVal)
      const {index, langtag} = self.props
      ActionCreator.editColumnHeaderDone(null, index, langtag, newVal)
      console.log("Finished editing column", self.props.name)
    }
  },

  render() {
    const {edit,index,columnContent,columnIcon,clickHandler,selected} = this.props
    if (index !== edit) {
      const css_class = (index === selected) ? "column-head column-selected" : "column-head"
      return (
          <div className={css_class} key={index} onClick={clickHandler}>
            {columnContent}
            {columnIcon}
          </div>
      )
    } else {
      const {name,langtag} = this.props
      return (
          <EditColumnEntry name={name}
                           index={index}
                           langtag={langtag}
                           cancelEdit={this.cancelEdit}
                           saveEdit={this.saveEdit} />
      )
    }
  }
})

module.exports = ColumnEntry