import React, {Component, PropTypes} from "react";
import * as f from "lodash/fp";
import {maybe} from "../../helpers/monads";
import {FallbackLanguage, Langtags, ColumnKinds} from "../../constants/TableauxConstants";
import classNames from "classnames";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import {convert} from "../../helpers/cellValueConverter";

const KEY = "translations";

class LanguageView extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    toggleExpand: PropTypes.func.isRequired
  };

  render() {
    const {cell, langtag, isExpanded, toggleExpand} = this.props;
    const value = f.prop(["value", langtag], cell);
    const buttonClass = classNames("fa", {
      "fa-minus": !value,
      "fa-chevron-down": value && !isExpanded,
      "fa-chevron-up": value && isExpanded
    });

    return (
      <div className="item translation-item">
        <div className="item-header">
          <div className="label">{getLanguageOrCountryIcon(langtag)}</div>
          <div className="toggle-button">
            <a href="#" onClick={toggleExpand}>
              <i className={buttonClass} />
            </a>
          </div>
        </div>
        {(value && isExpanded)
          ? (
            <div className="item-content">
              <div className="content-box">
                {convert(cell.kind, ColumnKinds.text, value)}
              </div>
            </div>
          )
          : null
        }
      </div>
    )
  }
}

class SingleLanguageView extends Component {
  static PropTypes = {
    cell: PropTypes.object.isRequired,
    setTranslationView: PropTypes.func.isRequired
  };

  render() {
    const {cell} = this.props;
    const value = (f.isNil(f.prop("value", this.props.cell)))
      ? "---"
      : convert(cell.kind, ColumnKinds.text, cell.value);
    return (
      <div className="item single-value">
        <div className="item-content">
          {value}
        </div>
      </div>
    )
  }
}

class TranslationPopup extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {translations: this.loadTranslations()};
  }

  loadTranslations = () => maybe(window.localStorage)
    .exec("getItem", KEY)
    .map(JSON.parse)
    .getOrElse({});

  storeTranslations = translations => maybe(window.localStorage)
    .exec("setItem", KEY, JSON.stringify(translations));

  toggleTranslation = lang => () => {
    const {translations} = this.state;
    const toggledLang = !f.prop(lang, translations);
    const newLangState = f.assoc(lang, toggledLang, translations);
    this.setState({translations: newLangState});
    this.storeTranslations(newLangState);
  };

  isExpanded = langtag => f.prop(["translations", langtag], this.state) || false;

  render() {
    const {cell, langtag, setTranslationView} = this.props;
    const title = f.prop(["column", "displayName", langtag], cell)
      || f.prop(["column", "displayName", FallbackLanguage], cell)
      || "";

    const comparator = lt => `${this.isExpanded(lt) ? 0 : 1}-${lt}`; // expanded first, then alphabetical

    return (
      <div className="translation-view">
        <div className="pseudo-header">
          <a href="#" onClick={() => setTranslationView({show: false})}>
            <i className="fa fa-times" />
          </a>
          <div>{title}</div>
        </div>
        <div className="content-items">
          {(!cell.isMultiLanguage)
            ? <SingleLanguageView cell={cell} />
            : f.compose(
              f.map(lt => <LanguageView key={lt} cell={cell} langtag={lt}
                                        isExpanded={this.isExpanded(lt)}
                                        toggleExpand={this.toggleTranslation(lt)}
              />),
              f.sortBy(comparator),
              f.reject(f.eq(langtag))
            )(Langtags)
          }
        </div>
      </div>
    )
  }
}

export default TranslationPopup;