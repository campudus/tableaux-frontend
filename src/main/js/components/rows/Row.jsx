var React = require('react');
var ReactDOM = require('react-dom');
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
    selectedCellExpandedRow : React.PropTypes.string,
    isRowExpanded : React.PropTypes.bool.isRequired,
    isRowSelected : React.PropTypes.bool,
    shouldCellFocus : React.PropTypes.bool
  },

  //Allows a good performance when editing large tables
  shouldComponentUpdate : function (nextProps, nextState) {
    //Update on every available prop change
    if (this.props.langtag != nextProps.langtag
      || this.props.row != nextProps.row
      || this.props.isRowExpanded != nextProps.isRowExpanded
    ) {
      return true;
    }
    //Don't update when I'm not selected and I will not get selected
    else if (!this.props.isRowSelected && (nextProps.selectedCell && (this.props.row.getId() !== nextProps.selectedCell.rowId))) {
      return false;
    }
    //When nothing is selected and I get selected
    else if (!this.props.selectedCell && nextProps.selectedCell && nextProps.selectedCell.rowId === this.props.row.getId()) {
      return true;
    }
    //When nothing is selected and I don't get expanded
    else if (!this.props.selectedCell && !nextProps.isRowExpanded) {
      return false;
    }
    else {
      return true;
    }
  },

  toggleExpand : function () {
    Dispatcher.trigger('disableShouldCellFocus');
    Dispatcher.trigger('toggleRowExpand', this.props.row);
  },

  onClickDelete : function (e) {
    Dispatcher.trigger('disableShouldCellFocus');
    var question = <p>Do you really want to delete that row?</p>;
    var ask = <Ask content={question} onYes={this.onYesOverlay} onCancel={this.onCancelOverlay}/>;

    Dispatcher.trigger('open-overlay', {
      head : <span>Delete?</span>,
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
      if (!cell.isMultiLanguage && !self.props.isRowExpanded) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={self.props.shouldCellFocus}/>;
      }

      // We don't want to repeat our self if expanded
      if (!cell.isMultiLanguage && self.props.isRowExpanded) {
        if (langtag === App.langtags[0]) {
          return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                       shouldFocus={self.props.shouldCellFocus}/>;
        } else {
          return self.renderSingleLanguageCell(cell, idx);
        }
      }

      // If value is multi-language just render cell
      if (cell.isMultiLanguage) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={self.props.shouldCellFocus}/>;
      }
    })
  },

  renderLanguageRow : function (langtag) {
    //Is this (multilanguage) row selected
    var selected = (this.props.isRowSelected && (langtag === this.props.selectedCellExpandedRow));
    //Set row class optional with selected class
    var className = 'row row-' + this.props.row.getId() + (selected ? " selected" : "");
    var deleteButton = null;

    // Add delete button to default-language row
    // or to every not expanded row
    if ((langtag === App.defaultLangtag || !this.props.isRowExpanded) && this.props.isRowSelected) {
      deleteButton = (
        <div className="delete-row">
          <button className="button" onClick={this.onClickDelete}>
            <i className="fa fa-trash"></i>
          </button>
        </div>
      )
    }

    return (
      <div key={this.props.row.getId() + "-" + langtag} className={className} tabIndex="-1">
        {deleteButton}
        {this.renderLangtag(langtag)}
        {this.renderCells(langtag, selected)}
      </div>
    );
  },

  render : function () {
    var self = this;
    console.log("----> Render Row <----");
    if (this.props.isRowExpanded) {
      // render all language-rows for this row
      var rows = App.langtags.map(function (langtag) {
        return self.renderLanguageRow(langtag);
      });
      return <div className="row-group expanded" tabIndex="-1">{rows}</div>;
    } else {
      return this.renderLanguageRow(this.props.langtag);
    }
  }
});

module.exports = Row;
