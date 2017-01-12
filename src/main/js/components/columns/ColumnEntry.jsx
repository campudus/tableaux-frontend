import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'
import EditColumnEntry from './EditColumnEntry'

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
                           langtag={langtag} />
      )
    }
  }
})

module.exports = ColumnEntry