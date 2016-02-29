var React = require('react');
var App = require('ampersand-app');
var Select = require('react-select');
var _ = require('lodash');

var LanguageSwitcher = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    onChange : React.PropTypes.func,
    openOnTop : React.PropTypes.bool,
    options : React.PropTypes.array,
    onChange : React.PropTypes.func
  },

  onChange : function (langObj) {
    //prevents undefined language tag: we just want to switch the language when there is actually something selected
    if (!_.isEmpty(langObj)) {
      var langtag = langObj.value;
      if (this.props.onChange) {
        this.props.onChange(langtag);
      }
    }
  },

  renderOption : function (option) {
    var langtag = option.value;
    var language = langtag.split(/-|_/)[0];
    var country = langtag.split(/-|_/)[1];
    var icon = country.toLowerCase() + ".png";
    return <span className="langtag">
      <img src={"/img/flags/" + icon} alt={country}/> {language.toUpperCase()}
    </span>;
  },

  render : function () {
    var options = this.props.options || App.langtags.reduce(function (res, langtag) {
        res.push({
          value : langtag,
          label : langtag
        });
        return res;
      }, []);

    return (
      <div id="language-switcher">
        <Select className={this.props.openOnTop?"open-on-top":""}
                options={options}
                searchable
                clearable={false}
                value={this.props.langtag}
                onChange={this.onChange}
                optionRenderer={this.renderOption}
                valueRenderer={this.renderOption}

        />
      </div>
    )
  }
});

module.exports = LanguageSwitcher;