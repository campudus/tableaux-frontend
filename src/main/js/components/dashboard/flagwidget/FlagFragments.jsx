import React from "react";
import i18n from "i18next";
import {getMultiLangValue} from "../../../helpers/multiLanguage";
import {branch, compose, pure, renderComponent, withHandlers, withStateHandlers} from "recompose";
import classNames from "classnames";
import App from "ampersand-app";
import f from "lodash/fp";
import {doto} from "../../../helpers/functools";
import {Langtags} from "../../../constants/TableauxConstants";

// const Langtags = ["de", "en", "en-US", "ch-IT", "fr"];

const HeaderIcon = ({flag}) => (flag === "comments")
  ? <i className="fa fa-commenting" />
  : <i className={"dot active " + flag} />;

const DefaultHeader = ({flag, children}) => (
  <div className={"header-wrapper " + flag}>
    <HeaderIcon flag={flag} />
    <div className="heading">{i18n.t(`dashboard:flag.heading-${flag}`) || flag}</div>
    {children}
  </div>
);

const HeaderWithLangTabs = ({setLangtag, selectedLang, flag}) => (
  <DefaultHeader flag={flag}>
    {f.map(
      (langtag) => (
        <a key={langtag}
           className={classNames("language-tab", {active: langtag === selectedLang})}
           href="#"
           draggable={false}
           onClick={(event) => { event.preventDefault(); setLangtag(langtag); }}
        >
          <div className="language-label">{doto(langtag, f.toLower, f.takeRight(2), f.join(""))}</div>
        </a>
      ),
      Langtags
    )}
  </DefaultHeader>
);

const Header = branch(
  (props) => props.flag === "needs-translation",
  renderComponent(HeaderWithLangTabs)
)(DefaultHeader);

const ElementCount = ({n, flag, selected}) => {
  const gotoString = (flag === "comments")
    ? "dashboard:flag.goto-comment"
    : "dashboard:flag.goto-table";
  return (selected)
    ? (
      <div className={"element-count"}>
        {i18n.t(gotoString)}
        <i className="fa fa-long-arrow-right" />
      </div>
    )
    : <div className={"element-count"}>{n}</div>;
};

const TableEntry = compose(
  pure,
  withHandlers({
    onMouseEnter: ({handleMouseEnter, index}) => () => {
      handleMouseEnter(index);
    },
    handleClick: ({table = {}, flag, langtag}) => (event) => {
      event.preventDefault();
      App.router.navigate(`/${langtag}/tables/${table.id}?filter:flag:${flag}`);
    }
  })
)(
  ({active, onMouseEnter, langtag, selectedLang, table = {}, style, selected, flag}) => (
    <a className={classNames("table-entry", {active, selected})}
       href={`/${selectedLang}/tables/${table.id}?filter:flag:${flag}`}
       style={style}
       onMouseEnter={onMouseEnter}
       draggable={false}
    >
      <div className="label">
        {getMultiLangValue(langtag, table.name, table.displayName)}
      </div>
      <ElementCount n={table.events}
                    selected={selected}
                    flag={flag}
      />
    </a>
  )
);

export {Header, TableEntry};
