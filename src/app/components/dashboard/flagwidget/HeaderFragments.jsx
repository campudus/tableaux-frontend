import React from "react";
import { branch, renderComponent } from "recompose";
import { doto } from "../../../helpers/functools";
import f from "lodash/fp";
import classNames from "classnames";
import { Langtags } from "../../../constants/TableauxConstants";
import i18n from "i18next";

const HeaderIcon = ({ flag }) =>
  flag === "comments" ? (
    <i className="fa fa-commenting" />
  ) : (
    <i className={"dot active " + flag} />
  );

const DefaultHeader = ({ flag, children }) => (
  <div className={"header-wrapper " + flag}>
    <HeaderIcon flag={flag} />
    <div className="heading">
      {i18n.t(`dashboard:flag.heading-${flag}`) || flag}
    </div>
    {children}
  </div>
);

const HeaderWithLangTabs = ({ setLangtag, selectedLang, flag }) => (
  <DefaultHeader flag={flag}>
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
  props => props.flag === "needs-translation",
  renderComponent(HeaderWithLangTabs)
)(DefaultHeader);
