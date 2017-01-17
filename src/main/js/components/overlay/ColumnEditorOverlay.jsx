import React from 'react'
import i18n from 'i18next'

class ColumnEditorOverlay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: this.props.name,
      description: this.props.description
    }
  }

  modifyName = (evt) => {
    if (evt && evt.target) {
      const new_state = { name: evt.target.value }
      this.setState(new_state)
      this.props.handleInput()(new_state)
    }
  }

  modifyDescription = (evt) => {
    if (evt && evt.target) {
      const new_state = { description: evt.target.value }
      this.setState(new_state)
      this.props.handleInput()(new_state)
    }
  }

  render = () => {
    return (
        <span >
          <text>{i18n.t("table:editor.colname")}</text>
          <textarea type="text" autoFocus className="input"
                    rows="2"
                    onChange={this.modifyName}
                    value={this.state.name} />
          <text>{i18n.t("table:editor.description")}</text>
          <textarea type="text" autoFocus className="input"
                    rows="6"
                    onChange={this.modifyDescription}
                    value={this.state.description} />
        </span>
    )
  }
}

ColumnEditorOverlay.propTypes = {
  name: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  index: React.PropTypes.number.isRequired,
  handleInput: React.PropTypes.func.isRequired
}

module.exports = ColumnEditorOverlay