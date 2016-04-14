import React from 'react';

let MetaCell = (props) => {
  const {langtag, rowId, onClick, rowExpanded} = props;
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

MetaCell.propTypes = {
  langtag : React.PropTypes.string.isRequired,
  rowId : React.PropTypes.number.isRequired,
  onClick : React.PropTypes.func.isRequired,
  rowExpanded : React.PropTypes.bool.isRequired
};

export default MetaCell;