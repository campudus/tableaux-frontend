import React from "react";
import { showDialog } from "./GenericOverlay";
import i18n from "i18next";

export function confirmDeleteFile(fileName, onYes) {
  showDialog({
    type: "question",
    context: fileName,
    title: i18n.t("media:delete_file_headline"),
    heading: <p>{i18n.t("media:confirm_delete_file", { fileName })}</p>,
    buttonActions: {
      negative: [i18n.t("common:yes"), onYes],
      neutral: [i18n.t("common:no"), null]
    }
  });
}

export function confirmDeleteFolder(folderName, onYes) {
  showDialog({
    type: "question",
    context: folderName,
    title: i18n.t("media:confirm_delete_folder_headline"),
    heading: (
      <p>{i18n.t("media:confirm_delete_folder_question", { folderName })}</p>
    ),
    buttonActions: {
      negative: [i18n.t("common:yes"), onYes],
      neutral: [i18n.t("common:no"), null]
    }
  });
}

export function noPermissionAlertWithLanguage(
  allowedLangtags,
  allowedCountries
) {
  let totalError;
  const userError = `${i18n.t(
    "common:access_management.no_permission_saving_language_description"
  )}:`;

  let allowedLangtagsMarkup, allowedCountriesMarkup;
  const allowedLanguagesLabel = (
    <span>{i18n.t("common:access_management.languages")}:</span>
  );
  const allowedCountriesLabel = (
    <span>{i18n.t("common:access_management.countries")}:</span>
  );

  if (allowedCountries && allowedCountries.length > 0) {
    allowedCountriesMarkup = allowedCountries.map((country, idx) => (
      <span key={idx}>{country}</span>
    ));
  } else {
    allowedCountriesMarkup = i18n.t(
      "common:access_management.language_array_empty"
    );
  }

  if (allowedLangtags && allowedLangtags.length > 0) {
    allowedLangtagsMarkup = allowedLangtags.map((langtag, idx) => (
      <span key={idx}>{langtag}</span>
    ));
  } else {
    allowedLangtagsMarkup = i18n.t(
      "common:access_management.language_array_empty"
    );
  }

  totalError = (
    <div>
      <p>{userError}</p>
      <p>
        <strong className="allowed-languages">
          {allowedLangtagsMarkup ? allowedLanguagesLabel : null}
          <span className="allowedValues">{allowedLangtagsMarkup}</span>{" "}
        </strong>
        <strong className="allowed-countries">
          {allowedLangtagsMarkup ? allowedCountriesLabel : null}
          <span className="allowedValues">{allowedCountriesMarkup}</span>
        </strong>
      </p>
    </div>
  );

  showDialog({
    type: "warning",
    context: i18n.t("common:error"),
    title: i18n.t("common:access_management.permission_denied_headline"),
    heading: i18n.t("table:error_occured_hl"),
    message: totalError,
    buttonActions: {
      neutral: [i18n.t("common:ok"), null]
    }
  });

  console.warn("Access denied. User can not edit this language.");
}

/* TODO-W this needs reduxActions too! */
export function cellModelSavingError(errorFromServer) {
  console.error(
    "Cell model saved unsuccessfully!",
    errorFromServer,
    "error text:",
    errorFromServer.body || errorFromServer.toString()
  );

  const userError = i18n.t("table:error_saving_cell");
  const techError =
    errorFromServer && errorFromServer.body
      ? errorFromServer.body
      : "Unspecified error";

  const totalError = (
    <p>
      <strong>Server error:</strong> {techError}
    </p>
  );

  showDialog({
    type: "warning",
    context: i18n.t("common:error"),
    title: i18n.t("table:error_occured_hl"),
    heading: userError,
    message: totalError,
    buttonActions: { neutral: [i18n.t("common:ok"), null] }
  });
}

export function simpleError(errorMsg, errorHead) {
  showDialog({
    type: "warning",
    context: i18n.t("common:error"),
    title: i18n.t("table:error_occured_hl"),
    heading: errorHead || i18n.t("table:error_occured_hl"),
    message: errorMsg,
    buttonActions: { neutral: [i18n.t("common:ok"), null] }
  });
}
