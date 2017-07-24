import React, {Component, PropTypes} from "react";
import * as f from "lodash/fp";
import {maybe, logged} from "../../helpers/monads";
import {ColumnKinds, FallbackLanguage, Langtags} from "../../constants/TableauxConstants";
import classNames from "classnames";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import SvgIcon from "../helperComponents/SvgIcon";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import {isTranslationNeeded} from "../../helpers/annotationHelper";
import Empty from "../helperComponents/emptyEntry";
import {switchEntityViewLanguage} from "../../actions/ActionCreator";
import i18n from "i18next";
import ReactMarkdown from "react-markdown";

const KEY = "translations";

const displayCell = (cell, langtag) => {
  const displayValue = f.get("displayValue", cell);
  const displayArray = () => (
    <ul>
      {displayValue.map((v, idx) => <li key={`${cell.id}-${langtag}-${idx}`}>
        {f.get(langtag, v)}
      </li>)}
    </ul>
  );
  const displayMarkdown = () => (
    <ReactMarkdown source={f.get(langtag, displayValue)}/>
  );

  const hasArrayValue = () => f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]);
  const hasMarkdownValue = () => cell.kind === ColumnKinds.richtext;

  const result = f.cond([
    [hasArrayValue, logged("array", displayArray)],
    [hasMarkdownValue, logged("markdown", displayMarkdown)],
    [f.stubTrue, logged("default", f.always(f.get(langtag, displayValue)))]
  ])(cell);

  return (f.isEmpty(result))
    ? <Empty/>
    : result;
};

const LanguageView = (props) => {
  const {cell, langtag, isExpanded, toggleExpand} = props;
  const value = f.get(["displayValue", langtag], cell);
  const buttonClass = classNames("fa", {
    "fa-angle-down": !isExpanded,
    "fa-angle-up": isExpanded
  });
  const wrapperClass = classNames("item translation-item", {"needs-translation": isTranslationNeeded(langtag)(cell)});

  return (
    <div className={wrapperClass} onClick={toggleExpand}>
      <div className="item-header">
        <a className="switch-language-icon" href="#"
           onClick={evt => {
             evt.stopPropagation();
             switchEntityViewLanguage({langtag});
           }}
        >
          <div className="label">
            {getLanguageOrCountryIcon(langtag)}
          </div>
          <SvgIcon icon="compareTranslation" />
        </a>

        <div className="toggle-button">
          <a href="#">
            <i className={buttonClass} />
          </a>
        </div>
      </div>
      {
        (isExpanded)
          ? (
            (f.isEmpty(f.trim(value)) && !f.isArray(cell.value))
              ? <div className="item-content">
                <div className="content-box">
                  <Empty />
                </div>
              </div>
              : <div className="item-content">
                <div className="content-box">
                  {displayCell(cell, langtag)}
                </div>
              </div>
          )
          : null
      }
    </div>
  );
};

const SingleLanguageView = props => {
  const {cell, langtag} = props;
  return (
    <div className="item single-value">
      <div className="item-content">
        {displayCell(cell, langtag)}
      </div>
    </div>
  );
};
SingleLanguageView.PropTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

const SingleLanguageWithAmpersand = connectToAmpersand(SingleLanguageView);
const MultiLanguageWithAmpersand = connectToAmpersand(LanguageView);

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

  toggleTranslation = lang => evt => {
    evt.stopPropagation();
    const {translations} = this.state;
    const toggledLang = !f.prop(lang, translations);
    const newLangState = f.assoc(lang, toggledLang, translations);
    this.setState({translations: newLangState});
    this.storeTranslations(newLangState);
  };

  setAllTranslations = status => () => {
    const newLangState = f.compose(
      f.reduce(f.merge, {}),
      f.map(lt => ({[lt]: status}))
    )(Langtags);
    this.setState({translations: newLangState});
    this.storeTranslations(newLangState);
  };

  isExpanded = langtag => f.prop(["translations", langtag], this.state) || false;

  render() {
    const {cell, langtag, setTranslationView} = this.props;
    const title = f.prop(["column", "displayName", langtag], cell)
      || f.prop(["column", "displayName", FallbackLanguage], cell)
      || "";

    const isAnyCollapsed = f.compose(
      f.any(f.complement(f.identity)),           // any not truthy
      f.map(f.last),                             // of "display" values
      f.reject(f.matchesProperty(0, langtag)),   // of elements without langtag === current langtag
      f.entries                                  // of tuples [langtag, "display"]
    )(this.state.translations);                  // of saved translations

    const toggleButtonClass = classNames("toggle-all-button", {"is-multi-lang": cell.isMultiLanguage});

    return (
      <div className="translation-view">
        <div className="pseudo-header">
          <a href="#" onClick={() => setTranslationView({show: false})}>
            <SvgIcon icon="cross" />
          </a>
          <div className="title">{title}</div>
          {(cell.isMultiLanguage)
            ? (
              <div className={toggleButtonClass}
                   onClick={this.setAllTranslations(isAnyCollapsed)}
              >
                <a href="#">
                  {i18n.t((isAnyCollapsed) ? "table:translations.expand_all" : "table:translations.collapse_all")}
                </a>
              </div>
            )
            : <div className="toggle-all-button">{i18n.t("table:translations.is_single_language")}</div>
          }
        </div>
        <div className="content-items">
          {(!cell.isMultiLanguage || f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]))
            ? <SingleLanguageWithAmpersand cell={cell} langtag={langtag} />
            : f.map(lt => <MultiLanguageWithAmpersand key={`${cell.id}-${lt}`} cell={cell} langtag={lt}
                                                      isExpanded={this.isExpanded(lt)}
                                                      toggleExpand={this.toggleTranslation(lt)}
              />,
              Langtags)
          }
        </div>
      </div>
    );
  }
}

export default TranslationPopup;
