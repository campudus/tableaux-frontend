import f from "lodash/fp";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  filterCellServices,
  getAllServices
} from "../../frontendServiceRegistry/frontendServices";
import route from "../../helpers/apiRoutes";
import { retrieveTranslation as t } from "../../helpers/multiLanguage";

const ContextMenuItem = ({ label, icon, url }) => {
  return (
    <Link to={url} className="context-menu__item">
      <i className={`context-menu__icon fa fa-${icon}`} />
      <div className="context-menu__item-label item-label">{label}</div>
    </Link>
  );
};

const ContextMenuServices = ({ cell, langtag }) => {
  const services = useSelector(
    f.compose(
      filterCellServices(cell),
      getAllServices
    )
  );
  const { table, column, row } = cell;

  return services.length > 0 ? (
    <>
      {services.map(s => {
        const label = t(langtag, s.displayName);
        const url = route.toFrontendServiceView(s.id, langtag, {
          tableId: table.id,
          rowId: row.id,
          columnId: column.id
        });

        return <ContextMenuItem key={s.name} label={label} url={url} />;
      })}
    </>
  ) : null;
};

ContextMenuServices.displayName = "ContextMenuServices";
export default ContextMenuServices;
