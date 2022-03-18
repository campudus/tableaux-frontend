import f from "lodash/fp";
import React from "react";
import { useSelector } from "react-redux";
import {
  filterCellServices,
  getAllServices
} from "../../frontendServiceRegistry/frontendServices";
import route from "../../helpers/apiRoutes";
import { retrieveTranslation as t } from "../../helpers/multiLanguage";
import ServiceLink from "./ServiceLink";

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
        const url = route.toFrontendServiceView(s.id, langtag);

        return (
          <ServiceLink
            key={s.id}
            to={url}
            classNames="context-menu__item"
            service={s}
            langtag={langtag}
            params={{
              tableId: table.id,
              rowId: row.id,
              columnId: column.id
            }}
          >
            <i className={`context-menu__icon fa fa-${s.icon}`} />
            <div className="context-menu__item-label item-label">{label}</div>
          </ServiceLink>
        );
      })}
    </>
  ) : null;
};

ContextMenuServices.displayName = "ContextMenuServices";
export default ContextMenuServices;
