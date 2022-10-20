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
import { Link } from "react-router-dom";

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

const TaxonomyDashboard = props => {
  const { langtag } = props;
  const tables_ = useSelector(selectTaxonomyTables);
  const tables = Array(12).fill(tables_[0]);
  const handleSwitchLangtag = useCallback(newLangtag => {
    switchLanguageHandler(history, newLangtag);
  });
  return (
    <div className="taxonomy-dashboard">
      <GrudHeader
        pageTitleOrKey={i18n.t("table:taxonomy.title")}
        langtag={langtag}
        handleLanguageSwitch={handleSwitchLangtag}
      />
      <main className="taxonomy-dashboard__content-wrapper">
        <section className="taxonomy-dashboard__header">
          <h1 className="taxonomy-dashboard__header-title">
            {i18n.t("table:taxonomy.title")}
          </h1>
        </section>
        <section className="taxonomy-dashboard__content">
          {tables.map(table => (
            <TaxonomyTableCard
              key={table.name}
              table={table}
              langtag={langtag}
            />
          ))}
        </section>
      </main>
    </div>
  );
};

TaxonomyDashboard.displayName = "TaxonomyDashboard";
export default TaxonomyDashboard;
