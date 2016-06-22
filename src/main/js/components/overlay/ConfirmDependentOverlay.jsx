import React from 'react';
import {translate} from 'react-i18next';
import {openOverlay, closeOverlay, removeRow} from '../../actions/ActionCreator';
import RowConcatHelper from '../../helpers/RowConcatHelper';
import i18n from 'i18next';
import {getTableDisplayName} from '../../helpers/multiLanguage';

let DeleteRowOverlayFooter = (props) => {
  return (
    <div className="button-wrapper">
      <button className="button negative" onClick={props.onYes}>{i18n.t('common:delete_yes_explicit')}</button>
      <button className="button neutral" onClick={closeOverlay}>{i18n.t('common:cancel')}</button>
    </div>
  );
};
DeleteRowOverlayFooter.propTypes = {
  onYes : React.PropTypes.func.isRequired
};

//Builds the actual dependent tables/rows DOM elements
let DependentTablesAndRows = (props) => {

  const {dependency, langtag} = props;

  if (dependency && dependency.length > 0) {
    let dependentTables = dependency.map((dep)=> {
      const {table, column, rows} = dep;
      const tableId = table.id;
      const linkToTable = `/${langtag}/table/${tableId}`;

      //Builds dependent rows inside dependent tables
      const rowsDisplay = rows.map((row, idx)=> {
        const dependentRowDisplayLabel = RowConcatHelper.getRowConcatStringWithFallback(row.value, column, langtag);
        return (
          <div key={idx} className="dependent-row">
            <span className="dependent-row-id">#{row.id}</span>
            {dependentRowDisplayLabel}
          </div>
        );
      });

      //Builds dependent tables
      return (
        <div key={tableId} className="dependent-table">
          <a className="table-link" href={linkToTable} target="_blank"><i
            className="fa fa-columns"/>{getTableDisplayName(table, langtag)}<i className="fa fa-angle-right"/></a>
          <div className="dependent-rows">
            {rowsDisplay}
          </div>
        </div>
      );
    });

    return (
      <div className="dependent-wrapper">
        {dependentTables}
      </div>
    );
  } else return null;
};
DependentTablesAndRows.propTypes = {
  dependency : React.PropTypes.array.isRequired,
  langtag : React.PropTypes.string.isRequired
};


let DeleteRowOverlayBody = (props) => {
  const {dependency, row, langtag} = props;
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getRowConcatStringWithFallback(firstCell.value, firstCell.column, langtag);

  const builtDependentView = <DependentTablesAndRows dependency={dependency} langtag={langtag}/>;
  return (
    <div>
      <div className="delete-row-question">
        <h1>{i18n.t('table:confirm_delete_row', {rowName : rowDisplayLabel})}</h1>
        {builtDependentView ?
          <p>{i18n.t('table:delete_row_dependent_text')}</p> :
          <p>{i18n.t('table:delete_row_no_dependent_rows')}</p>}
      </div>
      {builtDependentView}
    </div>
  );
};
DeleteRowOverlayBody.propTypes = {
  dependency : React.PropTypes.array
};

function openDependantOverlay(row, langtag, dependency) {
  console.log("openDependantOverlay got dependentContent:", dependency);

  const onYesRowDelete = () => {
    //removeRow(row.tableId, row.getId());
    console.log("NOW I CALL removeRow");
    closeOverlay();
  };

  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
    body : <DeleteRowOverlayBody row={row} dependency={dependency} langtag={langtag}/>,
    footer : <DeleteRowOverlayFooter onYes={onYesRowDelete}/>,
    type : "normal"
  });
}

export function confirmDeleteRow(row, langtag) {
  //check dependent rows
  row.dependent(
    (error)=> {
      console.log("confirmaDeleteRow dependent error:", error);
    },
    (res) => {
      openDependantOverlay(row, langtag, res);
    }
  );
}

