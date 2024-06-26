import React, { PureComponent } from "react";
import ReactMarkdown from "react-markdown";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";
import * as f from "lodash/fp";

import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import {
  getColumnDisplayName,
  getLanguageOrCountryIcon
} from "../../helpers/multiLanguage";
import { isTranslationNeeded } from "../../helpers/annotationHelper";
import { maybe, merge } from "../../helpers/functools";
import { safeRender } from "../../helpers/devWrappers";
import Empty from "../helperComponents/emptyEntry";
import MultiselectArea from "../MultiselectArea";
import SvgIcon from "../helperComponents/SvgIcon";

const KEY = "translations";

const displayCell = (cell, langtag) => {
  const displayValue = f.get("displayValue", cell);
  const displayArray = () => (
    <ul>
      {displayValue.map((v, idx) => (
        <li key={`${cell.id}-${langtag}-${idx}`}>{f.get(langtag, v)}</li>
      ))}
    </ul>
  );
  const displayMarkdown = () => (
    <ReactMarkdown source={f.get(langtag, displayValue)} />
  );

  const hasArrayValue = () =>
    f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]);
  const hasMarkdownValue = () => cell.kind === ColumnKinds.richtext;

  const result = f.cond([
    [hasArrayValue, displayArray],
    [hasMarkdownValue, displayMarkdown],
    [f.stubTrue, f.always(f.get(langtag, displayValue))]
  ])(cell);

  return f.isEmpty(result) ? <Empty /> : result;
};

const LanguageView = props => {
  const { cell, isMain, langtag, toggleExpand, handleLanguageSwitch } = props;
  const value = f.get(["displayValue", langtag], cell);
  const wrapperClass = classNames("item translation-item", {
    "needs-translation": isTranslationNeeded(langtag)(cell)
  });

  const switchLanguage = event => {
    event.stopPropagation();
    handleLanguageSwitch(langtag);
  };

  return (
    <div className={wrapperClass}>
      <button
        className={`item-header ${isMain ? "main" : ""}`}
        onClick={switchLanguage}
      >
        {getLanguageOrCountryIcon(langtag, "language")}
      </button>
      {f.isEmpty(f.trim(value)) && !f.isArray(cell.value) ? (
        <div className="item-content">
          <div className="content-box">
            <Empty />
          </div>
        </div>
      ) : (
        <div className="item-content">
          <div className="content-box">{displayCell(cell, langtag)}</div>
        </div>
      )}
      <button className="toggle-button" onClick={toggleExpand}>
        <SvgIcon icon="cross" />
      </button>
    </div>
  );
};

const SingleLanguageView = props => {
  const { cell, langtag } = props;
  return (
    <div className="item single-value">
      <div className="item-content">{displayCell(cell, langtag)}</div>
    </div>
  );
};
SingleLanguageView.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

class TranslationPopup extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { translations: this.loadTranslations() };
  }

  loadTranslations = () =>
    maybe(window.localStorage)
      .exec("getItem", KEY)
      .map(JSON.parse)
      .getOrElse(
        Langtags.reduce((accum, langtag) => {
          accum[langtag] = true;
          return accum;
        }, {})
      );

  storeTranslations = translations =>
    maybe(window.localStorage).exec(
      "setItem",
      KEY,
      JSON.stringify(translations)
    );

  toggleTranslation = lang => evt => {
    evt.stopPropagation();
    const { translations } = this.state;
    const toggledLang = !f.prop(lang, translations);
    const newLangState = f.assoc(lang, toggledLang, translations);
    this.setState({ translations: newLangState });
    this.storeTranslations(newLangState);
  };

  setAllTranslations = status => () => {
    const newLangState = f.flow(
      f.map(lt => ({ [lt]: status })),
      f.reduce(merge, {})
    )(Langtags);
    this.setState({ translations: newLangState });
    this.storeTranslations(newLangState);
  };

  isExpanded = langtag =>
    f.prop(["translations", langtag], this.state) || false;

  handleSelection = selected => {
    const translations = f.reduce(
      (obj, lt) => f.assoc(lt, f.contains(lt, selected), obj),
      {},
      Langtags
    );
    this.setState({ translations });
    this.storeTranslations(translations);
  };

  renderLangSelector = () => {
    const { cell, langtag } = this.props;
    const { translations } = this.state;
    const mkLanguageIcon = langtag => {
      const wrapperClass = classNames("translation-tag", {
        "needs-translation": isTranslationNeeded(langtag)(cell)
      });
      return (
        <div className={wrapperClass}>
          {getLanguageOrCountryIcon(langtag, "language")}
        </div>
      );
    };
    const selectedLangs = f.keys(translations).filter(lt => translations[lt]);

    const primaryFirst = langtag =>
      langtag === f.first(Langtags) ? "0" : langtag;

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

  render = safeRender(() => {
    const { cell, langtag, setTranslationView, switchLanguage } = this.props;
    const title = getColumnDisplayName(cell.column, langtag);

    const { translations } = this.state;

    const isAnyCollapsed = f.flow(
      f.entries, // of tuples [langtag, "display"]
      f.reject(f.matchesProperty(0, langtag)), // of elements without langtag === current langtag
      f.map(f.last), // of "display" values
      f.any(f.complement(f.identity)) // any not truthy
    )(this.state.translations); // of saved translations

    return (
      <div className="translation-view">
        <div className="pseudo-header">
          <button
            className="pseudo-header__close-button"
            onClick={() => setTranslationView({ show: false })}
          >
            <SvgIcon
              icon="cross"
              containerClasses="color-white"
              center={true}
            />
          </button>
          <div className="title">{title}</div>
          <button
            className="toggle-all-button"
            onClick={this.setAllTranslations(isAnyCollapsed)}
          >
            {i18n.t(
              isAnyCollapsed
                ? "table:translations.expand_all"
                : "table:translations.collapse_all"
            )}
          </button>
        </div>
        {this.renderLangSelector()}
        <div className="content-items">
          {!cell.column.multilanguage ||
          f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]) ? (
            <SingleLanguageView cell={cell} langtag={langtag} />
          ) : (
            Langtags.filter(lt => translations[lt]).map(lt => (
              <LanguageView
                key={`${cell.id}-${lt}`}
                cell={cell}
                langtag={lt}
                isExpanded={this.isExpanded(lt)}
                toggleExpand={this.toggleTranslation(lt)}
                isMain={langtag === lt}
                handleLanguageSwitch={switchLanguage}
              />
            ))
          )}
        </div>
      </div>
    );
  });
}

export default TranslationPopup;

TranslationPopup.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  switchLanguage: PropTypes.func.isRequired
};
