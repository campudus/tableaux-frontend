import React, {PropTypes, PureComponent} from "react";

export default class CellStack extends PureComponent {
  static propTypes = {
    measure: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.measure();
  }

  render() {
    return (
      <div className="cell-stack">
        {this.props.children}
      </div>
    );
  }
}
