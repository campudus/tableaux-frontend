import React, {Component} from "react";
import PropTypes from "prop-types";
import * as f from "lodash/fp";
import {maybe} from "../../helpers/functools";
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
import MultiselectArea from "../MultiselectArea";

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
    [hasArrayValue, displayArray],
    [hasMarkdownValue, displayMarkdown],
    [f.stubTrue, f.always(f.get(langtag, displayValue))]
  ])(cell);

  return (f.isEmpty(result))
    ? <Empty/>
    : result;
};

const LanguageView = (props) => {
  const {cell, isMain, langtag, toggleExpand} = props;
  const value = f.get(["displayValue", langtag], cell);
  const wrapperClass = classNames("item translation-item", {"needs-translation": isTranslationNeeded(langtag)(cell)});

  const switchLanguage = (event) => {
    event.stopPropagation();
    switchEntityViewLanguage({langtag});
  };

  return (
    <div className={wrapperClass} >
      <div className={`item-header ${(isMain) ? "main" : ""}`}>
        <a className="switch-language-icon"
          href="#"
          onClick={switchLanguage}
        >
          <div className="label">
            {getLanguageOrCountryIcon(langtag, "language")}
          </div>
        </a>
      </div>
      {(f.isEmpty(f.trim(value)) && !f.isArray(cell.value))
        ? (
          <div className="item-content">
            <div className="content-box">
              <Empty />
            </div>
          </div>
        )
        : (
          <div className="item-content">
            <div className="content-box">
              {displayCell(cell, langtag)}
            </div>
          </div>
        )
      }
      <div className="toggle-button">
        <a href="#" onClick={toggleExpand} >
          <SvgIcon icon="cross"/>
        </a>
      </div>
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
    const newLangState = f.flow(
      f.map(lt => ({[lt]: status})),
      f.reduce(f.merge, {})
    )(Langtags);
    this.setState({translations: newLangState});
    this.storeTranslations(newLangState);
  };

  isExpanded = langtag => f.prop(["translations", langtag], this.state) || false;

  handleSelection = (selected) => {
    const translations = f.reduce(
      (obj, lt) => f.assoc(lt, f.contains(lt, selected), obj),
      {},
      Langtags
    );
    this.setState({translations});
    this.storeTranslations(translations);
  };

  renderLangSelector = () => {
    const {cell, langtag} = this.props;
    const {translations} = this.state;
    const mkLanguageIcon = (langtag) => {
      const wrapperClass = classNames("translation-tag", {"needs-translation": isTranslationNeeded(langtag)(cell)});
      return (
        <div className={wrapperClass}>
          {getLanguageOrCountryIcon(langtag, "language")}
        </div>
      );
    };
    const selectedLangs = f.keys(translations)
      .filter((lt) => translations[lt]);

    const primaryFirst = (langtag) => (langtag === f.first(Langtags)) ? "0" : langtag;

    return (
      <div className="translation-select">
        <MultiselectArea
          langtag={langtag}
          options={Langtags}
          onChange={this.handleSelection}
          tagRenderer={mkLanguageIcon}
          listItemRenderer={mkLanguageIcon}
          selection={selectedLangs}
          placeholder="common:multiselect.select-translation"
          allSelected="common:multiselect.all-translations-open"
          order={primaryFirst}
        />
      </div>
    );
  };

  render() {
    const {cell, langtag, setTranslationView} = this.props;
    const title = f.prop(["column", "displayName", langtag], cell)
      || f.prop(["column", "displayName", FallbackLanguage], cell)
      || "";
    const {translations} = this.state;

    const isAnyCollapsed = f.flow(
      f.entries,                                 // of tuples [langtag, "display"]
      f.reject(f.matchesProperty(0, langtag)),   // of elements without langtag === current langtag
      f.map(f.last),                             // of "display" values
      f.any(f.complement(f.identity)),           // any not truthy
    )(this.state.translations);                  // of saved translations

    return (
      <div className="translation-view">
        <div className="pseudo-header">
          <a href="#" onClick={() => setTranslationView({show: false})}>
            <SvgIcon icon="cross" />
          </a>
          <div className="title">{title}</div>
          <div className="toggle-all-button"
            onClick={this.setAllTranslations(isAnyCollapsed)}
          >
            <a href="#">
              {i18n.t((isAnyCollapsed) ? "table:translations.expand_all" : "table:translations.collapse_all")}
            </a>
          </div>
        </div>
        {this.renderLangSelector()}
        <div className="content-items">
          {(!cell.isMultiLanguage || f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]))
            ? <SingleLanguageWithAmpersand cell={cell} langtag={langtag} />
            : Langtags
              .filter(
                (lt) => translations[lt]
              )
              .map(
                lt => <MultiLanguageWithAmpersand key={`${cell.id}-${lt}`} cell={cell} langtag={lt}
                  isExpanded={this.isExpanded(lt)}
                  toggleExpand={this.toggleTranslation(lt)}
                  isMain={langtag === lt}
                />
              )
          }
        </div>
      </div>
    );
  }
}

export default TranslationPopup;
