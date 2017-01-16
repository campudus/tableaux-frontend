import React from 'react'

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
          <textarea type="text" autoFocus className="input"
                    rows="2"
                    onChange={this.modifyName}
                    value={this.state.name} />
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