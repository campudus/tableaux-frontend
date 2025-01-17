import React from "react";
import { branch, renderComponent } from "recompose";
import { doto } from "../../../helpers/functools";
import f from "lodash/fp";
import classNames from "classnames";
import { Langtags } from "../../../constants/TableauxConstants";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import i18n from "i18next";
import AnnotationDot from "../../annotation/AnnotationDot";

const HeaderIcon = ({ flag, config }) =>
  flag === "comments" ? (
    <i className="fa fa-commenting" />
  ) : (
    <AnnotationDot color={config?.bgColor} active />
  );

const DefaultHeader = ({ langtag, flag, config, children }) => (
  <div
    className={"header-wrapper " + flag}
    style={{ borderColor: config?.bgColor }}
  >
    <HeaderIcon flag={flag} config={config} />
    <div className="heading">
      {flag === "comments"
        ? i18n.t(`dashboard:flag.heading-${flag}`)
        : retrieveTranslation(langtag, config?.displayName)}
    </div>
    {children}
  </div>
);

const HeaderWithLangTabs = ({
  langtag: _langtag,
  setLangtag,
  selectedLang,
  flag,
  config
}) => (
  <DefaultHeader flag={flag} config={config} langtag={_langtag}>
    {f.map(
      langtag => (
        <button
          key={langtag}
          className={classNames("language-tab", {
            active: langtag === selectedLang
          })}
          draggable={false}
          onClick={event => {
            event.preventDefault();
            setLangtag(langtag);
          }}
        >
          <div className="language-label">
            {doto(langtag, f.toLower, f.takeRight(2), f.join(""))}
          </div>
        </button>
      ),
      f.tail(Langtags) // TODO: tail() can be removed once we decided how to visualise needs_translation_other_langs for primary
    )}
  </DefaultHeader>
);

export default branch(
  props => props.flag === "needs_translation",
  renderComponent(HeaderWithLangTabs)
)(DefaultHeader);
