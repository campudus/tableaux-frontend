var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var App = require('ampersand-app');
var _ = require('lodash');

var Dispatcher = require('../../dispatcher/Dispatcher');
var Cell = require('../cells/Cell.jsx');

var Ask = React.createClass({
  propTypes : {
    onYes : React.PropTypes.func.isRequired,
    onCancel : React.PropTypes.func.isRequired,
    content : React.PropTypes.element.isRequired
  },

  _onYes : function (event) {
    this.props.onYes(event);
  },

  _onCancel : function (event) {
    this.props.onCancel(event);
  },

  render : function () {
    return (
      <div className="ask">
        {this.props.content}
        <button autoFocus onClick={this._onYes} className="button yes">Yes</button>
        <button onClick={this._onCancel} className="button cancel">Cancel</button>
      </div>
    )
  }
});

var Row = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Row',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    row : React.PropTypes.object.isRequired,
    selectedCell : React.PropTypes.object,
    selectedCellEditing : React.PropTypes.bool,
    expanded : React.PropTypes.bool.isRequired,
    selectedCellExpandedRow : React.PropTypes.string
  },

  getInitialState : function () {
    return {
      hover : false
    }
  },

  toggleExpand : function () {
    Dispatcher.trigger('toggleRowExpand', this.props.row);
  },

  onClickDelete : function () {
    console.log("i clicked Delete Button");
    var question = <p>Do you really want to delete that row?</p>;
    var ask = <Ask content={question} onYes={this.onYesOverlay} onCancel={this.onCancelOverlay}/>;

    Dispatcher.trigger('open-overlay', {
      head : "Delete?",
      body : ask,
      type : "flexible"
    });
  },

  onYesOverlay : function (event) {
    this.props.row.destroy();
    this.onCancelOverlay(event);
  },

  onCancelOverlay : function (event) {
    Dispatcher.trigger("close-overlay");
  },

  enableDeleteButton : function () {
    this.setState({hover : true});
  },

  disableDeleteButton : function () {
    this.setState({hover : false});
  },

  renderLangtag : function (langtag) {
    var language = langtag.split(/-|_/)[0];
    var country = langtag.split(/-|_/)[1];

    var icon = country.toLowerCase() + ".png";

    return (
      <div className={'cell cell-0-' + this.props.row.getId() + ' language'} onClick={this.toggleExpand}>
        <div className="cell-content"><img src={"/img/flags/" + icon} alt={country}/>{language.toUpperCase()}</div>
      </div>
    );
  },

  renderSingleLanguageCell : function (cell, idx) {
    var className = 'cell cell-' + cell.column.getId() + '-' + cell.rowId + ' repeat';
    return <div key={idx} className={className}>—.—</div>;
  },

  renderCells : function (langtag, isRowSelected) {
    var self = this;

    return this.props.row.cells.map(function (cell, idx) {

      //Check selected row for expanded multilanguage rows
      var selectedRow = !!isRowSelected;
      //Is this cell currently selected
      var selected = self.props.selectedCell ? (cell.getId() === self.props.selectedCell.getId()) && selectedRow : false;
      //Is this cell in edit mode
      var editing = selected ? self.props.selectedCellEditing : false;

      // We want to see single-language value even if not expanded
      if (!cell.isMultiLanguage && !self.props.expanded) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}/>;
      }

      // We don't want to repeat our self if expanded
      if (!cell.isMultiLanguage && self.props.expanded) {
        if (langtag === App.langtags[0]) {
          return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}/>;
        } else {
          return self.renderSingleLanguageCell(cell, idx);
        }
      }

      // If value is multi-language just render cell
      if (cell.isMultiLanguage) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}/>;
      }
    })
  },

  renderLanguageRow : function (langtag) {

    var selected;
    var className;
    var deleteButton = null;

    //Is this (multilanguage) row selected
    if (this.props.selectedCell && langtag === this.props.selectedCellExpandedRow) {
      selected = this.props.row.getId() === this.props.selectedCell.rowId;
    } else {
      selected = false;
    }

    //Set row class optional with selected class
    className = 'row row-' + this.props.row.getId() + (selected ? " selected" : "");

    // Add delete button to default-language row
    // or to every not expanded row
    if ((langtag === App.langtags[0] || !this.props.expanded) && this.state.hover) {
      deleteButton = (
        <div className="delete-row">
          <button className="button" onClick={this.onClickDelete}><i className="fa fa-trash"></i></button>
        </div>
      )
    }

    return (
      <div onMouseEnter={this.enableDeleteButton} onMouseLeave={this.disableDeleteButton}
           key={this.props.row.getId() + "-" + langtag} className={className}>
        {deleteButton}
        {this.renderLangtag(langtag)}
        {this.renderCells(langtag, selected)}
      </div>
    );
  },

  render : function () {
    var self = this;

    if (this.props.expanded) {
      // render all language-rows for this row
      var rows = App.langtags.map(function (langtag) {
        return self.renderLanguageRow(langtag);
      });

      return <div className="row-group expanded">{rows}</div>;
    } else {
      return this.renderLanguageRow(this.props.langtag);
    }
  }
});

module.exports = Row;
