import React from 'react';

class DisabledCell extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
    selected : React.PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
  }

  getValue = () => {
    const {cell, langtag} = this.props;

    let value;
    if (cell.isMultiLanguage) {
      value = cell.value[langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? "" : value;
  };

  render = () => {
    const value = this.getValue();

    return (
      <div className='cell-content'>
        {value === null ? "" : value}
      </div>
    );
  };
}

export default DisabledCell;