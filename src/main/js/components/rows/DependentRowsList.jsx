import React from "react";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import {getTableDisplayName} from "../../helpers/multiLanguage";
import {translate} from "react-i18next";
import Spinner from "../header/Spinner";
import LinkList from "../helperComponents/LinkList";

// Builds the actual dependent tables/rows DOM elements
@translate("table")
export default class DependentRowsList extends React.Component {

  static propTypes = {
    row: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    hasDependency: React.PropTypes.func.isRequired,
    hasNoDependency: React.PropTypes.func.isRequired
  };

  state = {
    loadingDependency: true,
    dependency: null
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
    // check dependent rows
    this.request = this.props.row.dependent(
      (error) => {
        console.log("checkDependency dependent error:", error);
        alert("Dependencies could not be checked. Please try again.");
        this.request = null;
      },
      (res) => {
        console.log("Response:", res)
        if (res && res.length > 0) {
          this.props.hasDependency(res.length);
        } else {
          this.props.hasNoDependency();
        }
        this.setState({
          dependency: res,
          loadingDependency: false
        });
        this.request = null;
      });
  }

  render() {
    const {langtag, t} = this.props;
    const {loadingDependency, dependency} = this.state;

    if (loadingDependency) {
      return <div className="dependent-loading-data">
        <Spinner isLoading={true} />
        <p>{t("fetching_dependent_rows")}</p>
      </div>;
    }

    const dependentTables = (dependency || []).map(
      ({table, column, rows}) => {
        const tableId = table.id;
        const linkToTable = `/${langtag}/tables/${tableId}`;
        const tableName = getTableDisplayName(table, langtag);
        const links = rows.map(
          (row) => {
            return {
              displayName: RowConcatHelper.getCellAsStringWithFallback(row.value, column, langtag),
              linkTarget: `${linkToTable}/rows/${row.id}?filter`
            }
          }
        );

        return (
          <div className="item">
            <a className="item-header" href={linkToTable}>
              {tableName}
              <i className="fa fa-external-link"/>
            </a>
            <LinkList key={table.id}
                      links={links}
            />
          </div>
        )
      }
    );

    return (
      <div className="dependent-wrapper">
        <div className="content-items">
          {dependentTables}
        </div>
      </div>
    );
  }
}
