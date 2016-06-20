import _ from 'lodash';
import {ColumnKinds, Langtags} from '../constants/TableauxConstants';
import Cookies from 'js-cookie';

//TODO: Read from local storage
export function getUserLanguageAccess() {
  const allowedLangsFromCookie = Cookies.get('userLangtagsAccess');
  if (isUserAdmin()) {
    //TODO: Get all available languages from tableaux server
    return allowedLangsFromCookie || Langtags;
  } else {
    return [];
  }
}

export function isUserAdmin() {

  //Just for development
  if (process.env.NODE_ENV != 'production') {
    return true;
  }

  const isAdminFromCookie = Cookies.get('userAdmin');
  if (isAdminFromCookie) {
    return isAdminFromCookie;
  } else return false;
}

//Can a user edit the given langtag
export function hasUserAccessToLanguage(langtag) {

  if (isUserAdmin()) {
    return true;
  }

  if (_.isString(langtag)) {
    return (getUserLanguageAccess() && getUserLanguageAccess().length > 0) ?
    getUserLanguageAccess().indexOf(langtag) > -1 : false;
  } else {
    console.error("hasUserAccessToLanguage() has been called with unknown parameter langtag:", langtag);
    return false;
  }
}

//Is the user allowed to change this cell in general? Is it multilanguage and no link or attachment?
export function canUserChangeCell(cell) {

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
    return true;
  } else {
    return false;
  }
}

//Reduce the value object before sending to server, so that just allowed languages gets sent
export function reduceValuesToAllowedLanguages(valueToChange) {

  console.log("valueToChange:", valueToChange);
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return {value : _.pick(valueToChange.value, getUserLanguageAccess())};
  }
}

export function reduceMediaValuesToAllowedLanguages(fileInfos) {
  if (isUserAdmin()) {
    return fileInfos;
  }
  console.log("fileInfos:", fileInfos);
  return _.map(fileInfos, (fileInfo, key) => {
    if (_.isObject(fileInfo)) {
      return _.pick(fileInfo, getUserLanguageAccess())
    } else {
      return fileInfo;
    }
  });
};
