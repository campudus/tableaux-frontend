import React from 'react';
import {openOverlay, closeOverlay} from '../../actions/ActionCreator';
import i18n from 'i18next';
import View from '../entityView/RowView';
import {ColumnKinds} from '../../constants/TableauxConstants';
import RowConcatHelper from '../../helpers/RowConcatHelper';

export function openEntityView(row, langtag) {

  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);

  const EntityViewFooter = (props) => {
    return (
      <div className="button-wrapper">
        <button className="button neutral" onClick={() => {
          closeOverlay()
        }}>{i18n.t('common:close')}</button>
      </div>
    );
  };

  const EntityViewBody = (props) => {
    const cells = row.cells.models;

    return (
      <div className="entityView">
        {cells.map((cell)=> {
          if (cell.kind === ColumnKinds.concat) {
            return null;
          }
          return <View key={cell.id} cell={cell} langtag={langtag} />
        })}
      </div>
    );
  };

  openOverlay({
    head : <span>{i18n.t('table:entity_view')}: {rowDisplayLabel}</span>,
    body : <EntityViewBody />,
    footer : <EntityViewFooter />,
    type : "full-flex"
  });
}
