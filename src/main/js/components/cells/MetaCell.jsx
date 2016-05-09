import React from 'react';

class MetaCell extends React.Component {

  constructor(props) {
    super(props);
  }

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    rowId : React.PropTypes.number.isRequired,
    onClick : React.PropTypes.func.isRequired,
    rowExpanded : React.PropTypes.bool.isRequired
  };

  shouldComponentUpdate(nextProps, nextState) {
    const {langtag,rowId,rowExpanded} = this.props;
    return (langtag !== nextProps.langtag
      || rowId !== nextProps.rowId
      || rowExpanded !== nextProps.rowExpanded
    )
  }

  render = () => {

    const {langtag, rowId, onClick, rowExpanded} = this.props;
    const language = langtag.split(/-|_/)[0];
    const country = langtag.split(/-|_/)[1];
    const icon = country.toLowerCase() + ".png";

    let cellContent = "";

    if (rowExpanded) {
      cellContent =
        <div><img src={"/img/flags/" + icon} alt={country}/><span className="language">{language.toUpperCase()}</span>
        </div>
    } else {
      cellContent =
        <div className="meta-info-collapsed">
          <div className="row-number">{rowId}</div>
          <div className="row-expand"><i className="fa fa-chevron-down"/></div>
        </div>;
    }

    return (
      <div className={'meta-cell cell cell-0-' + rowId + (rowExpanded ? " row-expanded": "")} onClick={onClick}>
        <div className="cell-content">
          {cellContent}
        </div>
      </div>
    );

  };

}

export default MetaCell;