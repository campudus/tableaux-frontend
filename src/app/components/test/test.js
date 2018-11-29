import React from "react";
import {connect} from "react-redux";
import ActionCreators from "../../redux/actionCreators";
import reduxActionHoc from "../../helpers/reduxActionHoc";
import _ from "lodash";

const mapStateToProps = state => {
  return {tables: state.tables, columns: state.columns, state: state};
};

class Test extends React.Component {
  render() {
    console.log(this.props.state);
    return (
      <div
        className="test"
        onClick={() => {
          this.props.loadTables();
          this.props.loadColumns(1);
          this.props.loadAllRows(1);
        }}>
        {JSON.stringify(this.props.columns)}
      </div>
    );
  }
}

export default reduxActionHoc(Test, mapStateToProps);
