var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var Dispatcher = require('../dispatcher/Dispatcher');

var Cell = require('./cell/Cell.jsx');

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
        <button onClick={this._onYes} className="button yes">Yes</button>
        <button onClick={this._onCancel} className="button cancel">Cancel</button>
      </div>
    )
  }
});

var Row = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      expanded : false,
      hover : false
    }
  },

  toggleExpand : function () {
    this.setState({
      expanded : !this.state.expanded
    });
  },

  onRemove : function () {
    this.props.row.destroy();
  },

  onClickDelete : function () {
    var question = <p>Do you really want to delete that row?</p>;
    var ask = <Ask content={question} onYes={this.onYesOverlay} onCancel={this.onCancelOverlay}/>;

    Dispatcher.trigger('openGenericOverlay', {
      head : "Delete?",
      body : ask
    }, "flexible");
  },

  onYesOverlay : function (event) {
    this.props.row.destroy();
    Dispatcher.trigger("closeGenericOverlay");
  },

  onCancelOverlay : function (event) {
    Dispatcher.trigger("closeGenericOverlay");
  },

  enableDeleteButton : function () {
    this.setState({hover : true});
  },

  disableDeleteButton : function () {
    this.setState({hover : false});
  },

  renderLanguageRow : function (currentLanguageTag, languageTag) {
    var className = 'row row-' + this.props.row.getId();

    var language = languageTag.split("_")[0];
    var country = languageTag.split("_")[1];

    var icon = country.toLowerCase() + ".png";

    var displayNone = {display : "none"};
    var display = {display : "inline"};

    var deleteButton = "";
    if (currentLanguageTag === languageTag) {
      deleteButton = (
        <div className="delete-row" style={ this.state.hover ? display : displayNone }>
          <button className="button" onClick={this.onClickDelete}><i className="fa fa-trash"></i></button>
        </div>
      )
    }

    return (
      <div onMouseEnter={this.enableDeleteButton} onMouseLeave={this.disableDeleteButton} key={languageTag}
           className={className}>

        {deleteButton}

        <div className={'cell cell-0-' + this.props.row.getId() + ' language'} onClick={this.toggleExpand}>
          <span><img src={"/img/flags/" + icon} alt={country}/> {language.toUpperCase()}</span>
        </div>

        {this.props.row.cells.map(function (cell, idx) {
          if (!cell.isMultiLanguage && currentLanguageTag !== languageTag) {
            var className = 'cell cell-' + cell.column.getId() + '-' + cell.rowId + ' repeat';
            return <div key={idx} className={className}>—.—</div>
          } else {
            return <Cell key={idx} cell={cell} language={languageTag}/>;
          }
        })}
      </div>
    );
  },

  render : function () {
    var self = this;

    var languageTags = [
      "de_DE",
      "en_GB"
    ];
    var currentLanguageTag = languageTags[0];

    if (this.state.expanded) {
      return (
        <div>
          {languageTags.map(function (languageTag) {
            return self.renderLanguageRow(currentLanguageTag, languageTag);
          })}
        </div>
      );
    } else {
      return this.renderLanguageRow(currentLanguageTag, currentLanguageTag);
    }
  }
});

module.exports = Row;
