import React from 'react';
import RowConcatHelper from '../../helpers/RowConcatHelper';
import {getTableDisplayName} from '../../helpers/multiLanguage';
import {translate} from 'react-i18next';
import Spinner from '../header/Spinner';

//Builds the actual dependent tables/rows DOM elements
@translate('table')
export default class DependentRowsList extends React.Component {

  static propTypes = {
    row : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    textHasDependency : React.PropTypes.element,
    textHasNoDependency : React.PropTypes.element,
  };

  state = {
    loadingDependency : true,
    dependency : null
  };

  request = null;

  constructor(props) {
    super(props);
    this.request = null;
  }

  componentWillMount() {
    this.checkDependency();
  }

  componentWillUnmount() {
    this.request ? this.request.abort() : null;
  }

  checkDependency() {
    //check dependent rows
    this.request = this.props.row.dependent(
      (error)=> {
        console.log("checkDependency dependent error:", error);
        alert("Dependencies could not be checked. Please try again.");
        this.request = null;
      },
      (res) => {
        this.setState({
          dependency : res,
          loadingDependency : false
        });
        this.request = null;
      });
  }


  render() {
    const {langtag, textHasDependency, textHasNoDependency, t} = this.props;
    const {loadingDependency, dependency} = this.state;
    let dependentInfoText = null, dependentTables = null;

    if (loadingDependency) {
      return <div className="dependent-loading-data">
        <Spinner isLoading={true}/>
        <p>{t('fetching_dependent_rows')}</p>
      </div>;
    }

    if (dependency && dependency.length > 0) {

      dependentInfoText = textHasDependency ? textHasDependency : null;

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
      dependentInfoText = textHasNoDependency ? textHasNoDependency : null;
    }

    return (
      <div className="dependent-wrapper">
        <div className="dependent-row-info">{dependentInfoText}</div>
        <div className="dependent-tables">
          {dependentTables}
        </div>
      </div>
    );
  }

}