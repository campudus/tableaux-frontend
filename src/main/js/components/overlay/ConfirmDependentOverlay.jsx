import React from 'react';
import {translate} from 'react-i18next';
import {openOverlay, closeOverlay, removeRow} from '../../actions/ActionCreator';
import RowConcatHelper from '../../helpers/RowConcatHelper';
import i18n from 'i18next';
import DependentRowsList from '../../components/rows/DependentRowsList';

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

let DeleteRowOverlayBody = (props) => {
  const {row, langtag} = props;
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getRowConcatStringWithFallback(firstCell.value, firstCell.column, langtag);
  const hasDependencyText = <p>{i18n.t('table:delete_row_dependent_text')}</p>;
  const hasNoDependencyText = <p>{i18n.t('table:delete_row_no_dependent_rows')}</p>;

  const builtDependentView = <DependentRowsList row={row} langtag={langtag}
                                                textHasDependency={hasDependencyText}
                                                textHasNoDependency={hasNoDependencyText}/>;
  return (
    <div className="delete-row-confirmation">
      <div className="delete-row-question">
        <h1>{i18n.t('table:confirm_delete_row', {rowName : rowDisplayLabel})}</h1>
      </div>
      {builtDependentView}
    </div>
  );
};
DeleteRowOverlayBody.propTypes = {
  dependency : React.PropTypes.array
};

export function confirmDeleteRow(row, langtag) {
  const onYesRowDelete = () => {
    removeRow(row.tableId, row.getId());
    closeOverlay();
  };

  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
    body : <DeleteRowOverlayBody row={row} langtag={langtag}/>,
    footer : <DeleteRowOverlayFooter onYes={onYesRowDelete}/>,
    type : "normal"
  });
}

