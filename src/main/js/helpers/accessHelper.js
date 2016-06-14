import _ from 'lodash';
import {ColumnKinds} from '../constants/TableauxConstants';

//TODO: Read from local storage
export function getUserLanguageAccess() {
  return ['fr-FR'];
}

//TODO: Read from local storage
export function isUserAdmin() {
  return false;
}

export function hasUserAccessToLanguage(langtag) {
  let isString = _.isString(langtag);
  let isArray = _.isArray(langtag);

  //convert 1 size array element to string
  if (isArray && langtag.length === 1) {
    langtag = langtag[0];
    isString = true;
    isArray = false;
  }

  if (isString) {
    return (getUserLanguageAccess() && getUserLanguageAccess().length > 0) ?
    getUserLanguageAccess().indexOf(langtag) > -1 : false;
  } else if (isArray) {
    return _.every(getUserLanguageAccess(), (o)=> langtag.indexOf(o) >= 0);
  } else {
    console.error("hasUserAccessToLanguage() has been called with unknown parameter langtag:", langtag);
    return false;
  }
}

export function canUserChangeCellWithValue(cell, valueToChange) {
  //const {column} = cell;

  if (!cell) {
    console.warn("hasUserAccesToCell() called with invalid parameter cell:", cell);
    return false;
  }

  //Admins can do everything
  if (isUserAdmin()) {
    return true;
  }

  //User is not admin
  //Links and attachments are considered single language
  if (cell.isMultiLanguage && (
      cell.kind === ColumnKinds.text ||
      cell.kind === ColumnKinds.shorttext ||
      cell.kind === ColumnKinds.richtext ||
      cell.kind === ColumnKinds.numeric ||
      cell.kind === ColumnKinds.boolean ||
      cell.kind === ColumnKinds.datetime
    )) {


    console.log("canUserChangeCellWithValue() can be true, check value:", valueToChange);
    return true;
  } else {
    return false;
  }
}

export function limitValueToAllowedLanguages(valueToChange) {

  return valueToChange;

}