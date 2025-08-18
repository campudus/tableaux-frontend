import classNames from "classnames";
import i18n from "i18next";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import ReactMarkdown from "react-markdown";
import {
  ColumnKinds,
  Langtags,
  LanguageType
} from "../../constants/TableauxConstants";
import { isTranslationNeeded } from "../../helpers/annotationHelper";
import {
  getColumnDisplayName,
  getCountryOfLangtag,
  getLanguageOrCountryIcon
} from "../../helpers/multiLanguage";
import Empty from "../helperComponents/emptyEntry";
import SvgIcon from "../helperComponents/SvgIcon";
import MultiselectArea from "../MultiselectArea";

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
  const isCountryCell = () => cell.column.languageType === LanguageType.country;

  const displayCountryValue = () => cell.value[getCountryOfLangtag(langtag)];

  const result = f.cond([
    [hasArrayValue, displayArray],
    [hasMarkdownValue, displayMarkdown],
    [isCountryCell, displayCountryValue],
    [f.stubTrue, f.always(f.get(langtag, displayValue))]
  ])(cell);

  console.log({
    isCountryCell: isCountryCell(cell),
    value: cell.value,
    langtag,
    ctLt: getCountryOfLangtag(langtag),
    result
  });

  return f.isEmpty(result) ? <Empty /> : result;
};

const LanguageView = ({
  cell,
  isMain,
  langtag,
  toggleExpand,
  handleLanguageSwitch
}) => {
  const value = f.get(["displayValue", langtag], cell);
  const wrapperClass = classNames("item translation-item", {
    "needs-translation": isTranslationNeeded(langtag)(cell)
  });

  const switchLanguage = event => {
    event.stopPropagation();
    if (Langtags.includes(langtag)) handleLanguageSwitch(langtag);
  };

  return (
    <div className={wrapperClass}>
      <button
        className={`item-header ${isMain ? "main" : ""}`}
        onClick={switchLanguage}
      >
        {getLanguageOrCountryIcon(langtag, cell.column.languageType)}
      </button>
      <div className="item-content">
        <div className="content-box">
          {f.isEmpty(f.trim(value)) && !f.isArray(cell.value) ? (
            <Empty />
          ) : (
            displayCell(cell, langtag)
          )}
        </div>
      </div>
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

const TranslationPopup = ({
  cell,
  langtag,
  setTranslationView,
  switchLanguage
}) => {
  const allLangtags =
    cell.column.languageType === "country"
      ? cell.column.countryCodes
      : Langtags;
  const [visibleLangtags, setVisibleLangtags] = React.useState(allLangtags);

  const storageKey = `trn-${cell.column.languageType}`;
  React.useEffect(() => {
    const persistedLangtags = localStorage.getItem(storageKey);
    setVisibleLangtags(
      persistedLangtags ? JSON.parse(persistedLangtags) : allLangtags
    );
  }, [allLangtags.join(",")]);
  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleLangtags));
  }, [visibleLangtags.join(",")]);

  const isAnyLangtagHidden = visibleLangtags.length !== allLangtags.length;
  const isUnTranslatableCell =
    !cell.column.multilanguage ||
    f.contains(cell.kind, [ColumnKinds.attachment, ColumnKinds.link]);
  const handleClose = () => setTranslationView(false);
  const toggleTranslation = ltToToggle => {
    const visibleLangtagLookup = new Set(visibleLangtags);
    const ltWasVisible = visibleLangtagLookup.has(ltToToggle);
    const newLangtags = allLangtags.filter(
      ltWasVisible
        ? lt => visibleLangtagLookup.has(lt) && lt !== ltToToggle
        : lt => visibleLangtagLookup.has(lt) || lt === ltToToggle
    );
    setVisibleLangtags(newLangtags);
  };
  const title = getColumnDisplayName(cell.column, langtag);
  const toggleAllTranslations = () => {
    setVisibleLangtags(isAnyLangtagHidden ? allLangtags : []);
  };
  const mkLanguageIcon = React.useCallback(
    langtag => <LanguageIcon cell={cell} langtag={langtag} />,
    [cell]
  );

  const primaryFirst = React.useCallback(
    langtag => (langtag === f.first(Langtags) ? "0" : langtag),
    []
  );

  return (
    <div className="translation-view">
      <div className="pseudo-header">
        <button className="pseudo-header__close-button" onClick={handleClose}>
          <SvgIcon icon="cross" containerClasses="color-white" center={true} />
        </button>
        <div className="title">{title}</div>
        <button className="toggle-all-button" onClick={toggleAllTranslations}>
          {i18n.t(
            isAnyLangtagHidden
              ? "table:translations.expand_all"
              : "table:translations.collapse_all"
          )}
        </button>
      </div>
      <div className="translation-select">
        <MultiselectArea
          langtag={langtag}
          options={allLangtags}
          onChange={toggleTranslation}
          tagRenderer={mkLanguageIcon}
          listItemRenderer={mkLanguageIcon}
          selection={visibleLangtags}
          placeholder="common:multiselect.select-translation"
          allSelected="common:multiselect.all-translations-open"
          order={primaryFirst}
        />
      </div>
      <div className="content-items">
        {isUnTranslatableCell ? (
          <SingleLanguageView cell={cell} langtag={langtag} />
        ) : (
          visibleLangtags.map(lt => (
            <LanguageView
              key={`${cell.id}-${lt}`}
              cell={cell}
              langtag={lt}
              isExpanded={true}
              toggleExpand={() => toggleTranslation(lt)}
              isMain={langtag === lt}
              handleLanguageSwitch={switchLanguage}
            />
          ))
        )}
      </div>
    </div>
  );
};

const LanguageIcon = ({ cell, langtag }) => {
  const wrapperClass = classNames("translation-tag", {
    "needs-translation": isTranslationNeeded(langtag)(cell)
  });
  return (
    <div className={wrapperClass}>
      {getLanguageOrCountryIcon(langtag, cell.languageType)}
    </div>
  );
};

export default TranslationPopup;

TranslationPopup.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  switchLanguage: PropTypes.func.isRequired
};
