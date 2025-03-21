import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  getTableDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import * as t from "./taxonomy";
import route from "../../helpers/apiRoutes";
import { Link, withRouter } from "react-router-dom";
import { supportDetails } from "../dashboard/support/SupportWidget";

const TaxonomyTableCard = ({ table, langtag }) => (
  <div className="card">
    <header className="card__header">
      <h1 className="card__header-title">
        {getTableDisplayName(table, langtag)}
      </h1>{" "}
    </header>
    <section className="card__content">
      <div>{retrieveTranslation(langtag, table.description)}</div>
    </section>
    <footer className="card__footer">
      <Link to={route.toTable({ tableId: table.id })}>
        <button className="button default">{i18n.t("common:open")}</button>
      </Link>
    </footer>
  </div>
);

const selectTaxonomyTables = f.compose(
  f.filter(t.isTaxonomyTable),
  f.propOr([], "tables.data")
);

const TaxonomyTiles = ({ tables, langtag }) => (
  <section className="taxonomy-dashboard__content">
    {tables.map(table => (
      <TaxonomyTableCard key={table.name} table={table} langtag={langtag} />
    ))}
  </section>
);

const NoTaxonomiesYet = () => (
  <section className="taxonomy-dashboard__content--empty">
    <img className="fancy-image" alt="" src="/img/taxonomies-empty.png" />
    <div className="title">{i18n.t("dashboard:taxonomy.title")}</div>
    <div className="description">
      {i18n.t("dashboard:taxonomy.description")}
    </div>

    <a
      className="support-email-button"
      href={`mailto:
${supportDetails.email}`}
    >
      {i18n.t("dashboard:taxonomy.cta")}
    </a>
  </section>
);

const TaxonomyDashboard = props => {
  const { history, langtag } = props;
  const tables = useSelector(selectTaxonomyTables);
  const handleSwitchLangtag = useCallback(newLangtag => {
    switchLanguageHandler(history, newLangtag);
  });
  return (
    <div className="taxonomy-dashboard">
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleSwitchLangtag}
      />
      <main className="taxonomy-dashboard__content-wrapper">
        <section className="taxonomy-dashboard__header">
          <h1 className="taxonomy-dashboard__header-title">
            {i18n.t("table:taxonomy.title")}
          </h1>
        </section>
        {f.isEmpty(tables) ? (
          <NoTaxonomiesYet />
        ) : (
          <TaxonomyTiles tables={tables} langtag={langtag} />
        )}
      </main>
    </div>
  );
};

TaxonomyDashboard.displayName = "TaxonomyDashboard";
export default withRouter(TaxonomyDashboard);
