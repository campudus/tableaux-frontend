import React from "react";
import {connect} from "react-redux";
import ActionCreators from "../../redux/actionCreators";
import reduxActionHoc from "../../helpers/reduxActionHoc";
import _ from "lodash";
import "./table.scss";

const mapStateToProps = state => {
  return {tables: state.tables.tables};
};

class Test extends React.Component {
  render() {
    return (
      <div className="test" onClick={() => this.props.loadTables()}>
        {JSON.stringify(this.props.tables)}
      </div>
    );
  }
}

export default reduxActionHoc(Test, mapStateToProps);
