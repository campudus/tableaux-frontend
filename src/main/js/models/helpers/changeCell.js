import apiUrl from "../../helpers/apiUrl";
import {ColumnKinds} from "../../constants/TableauxConstants";
import ActionCreator from "../../actions/ActionCreator";
import {cellModelSavingError, noPermissionAlertWithLanguage} from "../../components/overlay/ConfirmationOverlay.jsx";
import {
  canUserChangeCell,
  getUserCountryCodesAccess,
  getUserLanguageAccess,
  isUserAdmin,
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../../helpers/accessManagementHelper";
import request from "superagent";
import * as f from "lodash/fp";
import Raven from "raven-js";
import {remember} from "../../components/table/undo/tableHistory";

async function changeCell({cell, value, options = {}}) {
  window.devLog(`Changing ${cell.kind} cell ${cell.id} from`, cell.value, "to", (value.value || value));
  Raven.captureBreadcrumb({
    message: `Change cell ${cell.id}`,
    data: {
      before: cell.value,
      after: value
    },
    category: (f.matchesProperty("type", "UNDO") ? "undo" : "direct change")
  });

  const oldValue = f.clone(cell.value);
  const changeObj = {
    cell,
    value,
    options
  };

  try {
    if (cell.kind === ColumnKinds.link) {
      await changeLinkCell(changeObj);
    } else {
      await changeDefaultCell(changeObj);
    }
    ActionCreator.broadcastDataChange({
      cell,
      row: cell.row
    });
  } catch (err) {
    Raven.captureBreadcrumb({message: "Error saving cell value to server"});
    Raven.captureException(err);
    cellModelSavingError(err);
    cell.set({value: oldValue});
    return;
  }
  if (!f.matchesProperty("type", "UNDO")(options)) {
    remember({
      cell,
      value: oldValue
    });
  }
}

async function changeDefaultCell({cell, value, options}) {
  const oldValue = cell.value;
  let newValue = value; // value we send to the server
  let mergedValue; // The value we display for the user
  let updateNecessary = false;
  let isPatch = false;

  // Setup for saving the cell
  if (cell.isMultiLanguage) {
    mergedValue = f.merge(oldValue, newValue);
    newValue = {value: newValue};
    updateNecessary = !f.equals(oldValue, mergedValue);
    isPatch = true;
  } else {
    updateNecessary = !f.equals(oldValue, newValue);
    mergedValue = newValue;
    newValue = {value: newValue};
  }

  if (updateNecessary) {
    /**
     * Basic language access management
     */
    if (!isUserAdmin()) {
      if (!canUserChangeCell(cell)) {
        noPermissionAlertWithLanguage(getUserLanguageAccess());
        return;
      } else {
        if (cell.isMultiCountry()) {
          newValue = reduceValuesToAllowedCountries(newValue);
          if (f.isEmpty(newValue.value)) {
            // The user tried to change a multilanguage cell without language permission
            noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
            return;
          }
        } else {
          // reduce values to send just authorized language values to server
          newValue = reduceValuesToAllowedLanguages(newValue);
          if (f.isEmpty(newValue.value)) {
            // The user tried to change a multilanguage cell without language permission
            noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
            return;
          }
        }
      }
    }
    /**
     * End basic language access management
     */

    cell.set({value: mergedValue});

    // we need to clear the newValue, otherwise ampersand save method is merging a strange object
    if (!isPatch) {
      newValue = null;
    }

    return new Promise(
      (resolve, reject) => {
        cell.save(newValue, {
          patch: isPatch,
          wait: true,
          success(model, data, options) {
            // is there new data from the server?
            if (!f.equals(data.value, mergedValue)) {
              window.devLog("Cell model saved successfully. Server data changed meanwhile:", data.value, mergedValue);
              cell.value = data.value;
            }
            resolve();
          },
          error(error) {
            throw error;
          }
        });
      }
    );
  }
}

async function changeLinkCell({cell, value}) {
  const curValue = cell.value;
  const rowDiff = f.xor(curValue.map(link => link.id), value.map(link => link.id));

  const isReorder = (value) => f.size(value) > 1
    && f.size(curValue) === f.size(value)
    && f.size(f.intersection(value.map(f.get("id")), curValue.map(f.get("id")))) === f.size(curValue);

  const isMultiSet = () => f.size(rowDiff) > 1;

  const changeFn = f.cond([
    [isReorder, f.always(reorderLinks)],
    [isMultiSet, f.always(() => changeDefaultCell({cell, value}))],
    [f.stubTrue, f.always(toggleLink(rowDiff))]
  ])(value);

  await changeFn({cell, value});
}

async function reorderLinks({cell, value}) {
  const swappers = f.flow(
    // remove all elements which kept their position
    f.reject(([a, b]) => f.get("id", a) === f.get("id", b)),
    // reduce remaining tuples to single entries in two steps, so only the swapped elements remain
    f.map(f.dropRight(1)),
    f.flatten,
    // retrieve ids of swapped elements in new order
    f.map("id"),
  )(f.zip(value, cell.value)); // Input: tuples of element at index i before and after swap
  cell.set({value: f.map(f.pick(["id", "value"]), value)}); // don't store LinkOverlay's display value
  const sortUrl = `/tables/${cell.tableId}/columns/${cell.column.id}/rows/${cell.row.id}/link/${f.first(swappers)}/order`;
  await request
    .put(apiUrl(sortUrl))
    .send({
      location: "before",
      id: swappers[1]
    });
}

function toggleLink(rowDiff) {
  return async function toggleLink({cell, value}) {
    const curValue = cell.value;
    const [toggledRowId] = rowDiff;
    if (!toggledRowId) {
      return new Promise((resolve, reject) => {
        reject("Tried to toggle zero links");
      });
    }
    const {rowId, tableId} = cell;
    const colId = cell.column.id;
    const backendUrl = apiUrl(`/tables/${tableId}/columns/${colId}/rows/${rowId}`);
    cell.set({value: value}); // set locally so fast follow-up request will have correct state
    const xhrRequest = (curValue.length > value.length)
      ? request.delete(`${backendUrl}/link/${toggledRowId}`)
      : request
        .patch(backendUrl)
        .send({value: toggledRowId})
        .set("Content-Type", "application/json");
    await xhrRequest;
  };
}

export default changeCell;
