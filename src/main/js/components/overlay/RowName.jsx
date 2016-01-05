var React = require('react');
var Cell = require('../../models/Cell');

var RowName = React.createClass({

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string
  },

  getInitialState : function () {
    return {
      rowName : ""
    }
  },

  componentWillMount : function () {

    if (!this.props.cell) {
      return;
    }

    var self = this;
    var cell = this.props.cell;
    var currentTableId = cell.tableId;
    var currentRowId = cell.rowId;
    var currentColumn = cell.tables.get(currentTableId).columns.at(0);

    console.log("currentRow is: ", currentRowId);
    console.log("currentTabel is:", currentTableId);
    console.log("cell is:", cell);
    console.log("tables are:", cell.tables);
    console.log("column:", currentColumn);

    var masterCell = new Cell({
      rowId : currentRowId,
      tableId : currentTableId,
      tables : cell.tables,
      column : currentColumn
    });

    masterCell.fetch({
      success : function (model, response, options) {
        console.log("masterCell success: ", model);
        if (model.kind !== "shorttext" && model.kind !== "text" && model.kind !== "richtext") {
          return;
        }
        if (model.isMultiLanguage) {
          console.log("multiLanguage: ", model.value[self.props.langtag]);
          self.setState({rowName : model.value[self.props.langtag]});
        } else {
          console.log("is not multiLanguage");
          self.setState({rowName : model.value});
        }
      },
      error : function (err) {
        console.error("error fetching masterCell", err);
      }
    });

  },

  componentDidMount : function () {

  },

  render : function () {

    if (this.props.cell != null) {
      return (
          <span>{this.state.rowName !== "" ? "(" + this.state.rowName + ")" : "" }</span>
      );
    } else {
      return null;
    }
  }

});

module.exports = RowName;
