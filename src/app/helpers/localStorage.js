import { either } from "./functools";
import f from "lodash/fp";
import { GLOBAL_SETTINGS_DEFAULT } from "../redux/reducers/globalSettings";

const getStoredViewObject = (tableId = null, name = "default") => {
  if (tableId) {
    return either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .map(f.get([tableId.toString(), name]))
      .getOrElse({});
  } else {
    return either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .getOrElse({});
  }
};
const saveFilterSettings = (tableId, settings = {}, name = "default") => {
  if (!localStorage) {
    return;
  }

  const savedViews = getStoredViewObject(null, name);
  const newViewsObj = f.set(
    [tableId, name, "rowsFilter"],
    settings,
    savedViews
  );
  localStorage["tableViews"] = JSON.stringify(newViewsObj);
};
const saveColumnVisibility = (tableId, view, name = "default") => {
  if (!localStorage) {
    return;
  }
  const savedViews = getStoredViewObject(null, name);
  localStorage["tableViews"] = JSON.stringify(
    f.set([tableId, name, "visibleColumns"], view, savedViews)
  );
};

const saveColumnOrdering = (tableId, ordering = [], name = "default") => {
  if (!localStorage) {
    return;
  }
  const savedViews = getStoredViewObject(null, name);
  localStorage["tableViews"] = JSON.stringify(
    f.set([tableId, name, "columnOrdering"], ordering, savedViews)
  );
};

const saveColumnWidths = (tableId, widths = {}, name = "default") => {
  if (!localStorage) {
    return;
  }
  const savedViews = getStoredViewObject(null, name);
  localStorage["tableViews"] = JSON.stringify(
    f.set([tableId, name, "columnWidths"], widths, savedViews)
  );
};

const saveAnnotationHighlight = (tableId, highlight = "", name = "default") => {
  if (!localStorage) {
    return;
  }
  const savedViews = getStoredViewObject(null, name);
  localStorage["tableViews"] = JSON.stringify(
    f.set([tableId, name, "annotationHighlight"], highlight, savedViews)
  );
};

const readGlobalSettings = () => {
  return either(localStorage)
    .map(f.get("globalSettings"))
    .map(JSON.parse)
    .getOrElse(GLOBAL_SETTINGS_DEFAULT);
};

const storeGlobalSettings = globalSettingsUpdate => {
  if (!localStorage) {
    return;
  }
  const globalSettings = readGlobalSettings();
  localStorage["globalSettings"] = JSON.stringify({
    ...globalSettings,
    ...globalSettingsUpdate
  });
};

export {
  getStoredViewObject,
  saveFilterSettings,
  saveColumnVisibility,
  saveColumnOrdering,
  saveColumnWidths,
  saveAnnotationHighlight,
  readGlobalSettings,
  storeGlobalSettings
};
