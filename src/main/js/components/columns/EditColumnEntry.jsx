import React from 'react'
import AmpersandMixin from 'ampersand-react-mixin'

const EditColumnEntry = React.createClass({
  mixins: [AmpersandMixin],

  PropTypes: {
    name: React.PropTypes.string.isRequired,
    index: React.PropTypes.number.isRequired,
    langtag: React.PropTypes.string.isRequired
  },

  render() {
    const {name,index,langtag} = this.props
    return (
        <div className="column-head column-head-edit">
          <textarea autoFocus className="input"
                    name={"col-"+index}
                    defaultValue={name} />
        </div>
    )
  }
})

module.exports = EditColumnEntry