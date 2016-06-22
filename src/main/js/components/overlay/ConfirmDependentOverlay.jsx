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
class DependentTablesAndRows extends React.Component {

  static propTypes = {
    row : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  };

  state = {
    loadingDependency : true,
    dependency : null
  };

  constructor(props) {
    super(props);
    this.checkDependency();
  }

  componentWillMount() {

  }

  checkDependency() {
    //check dependent rows
    this.props.row.dependent(
      (error)=> {
        console.log("checkDependency dependent error:", error);
        alert("Dependencies could not be checked. Please try again.");
      },
      (res) => {
        this.setState({
          dependency : res.dependent,
          loadingDependency : false
        });
      }
    );
  }


  render() {
    const {langtag} = props;
    const {loadingDependency, dependency} = this.state;
    let dependentInfoText = null, dependentTables = null;

    if (loadingDependency) {
      return <div className="dependent-loading-data">Fetching dependent data...</div>;
    }

    if (dependency && dependency.length > 0) {

      dependentInfoText = i18n.t('table:delete_row_dependent_text');

      dependentTables = dependency.map((dep)=> {
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

    } else {
      dependentInfoText = i18n.t('table:delete_row_no_dependent_rows');
    }

    return (
      <div className="dependent-wrapper">
        <p className="dependent-row-info">{dependentInfoText}</p>
        {dependentTables}
      </div>
    );

  }


}


let DeleteRowOverlayBody = (props) => {
  const {row, langtag} = props;
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getRowConcatStringWithFallback(firstCell.value, firstCell.column, langtag);

  const builtDependentView = <DependentTablesAndRows row={row} langtag={langtag}/>;
  return (
    <div>
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

function openDependantOverlay(row, langtag) {

  const onYesRowDelete = () => {
    //removeRow(row.tableId, row.getId());
    console.log("NOW I CALL removeRow");
    closeOverlay();
  };

  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
    body : <DeleteRowOverlayBody row={row} langtag={langtag}/>,
    footer : <DeleteRowOverlayFooter onYes={onYesRowDelete}/>,
    type : "normal"
  });
}

export function confirmDeleteRow(row, langtag) {

  openDependantOverlay(row, langtag);

  //check dependent rows
  /*row.dependent(
   (error)=> {
   console.log("confirmaDeleteRow dependent error:", error);
   },
   (res) => {
   openDependantOverlay(row, langtag, res);
   }
   );*/
}

