import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import DependentRowsList from "../../components/rows/DependentRowsList";
import { buildClassName } from "../../helpers/buildClassName";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import OverlayHeadRowIdentificator from "./OverlayHeadRowIdentificator";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import Button from "../Button/Button";
import { showDialog } from "./GenericOverlay";
import Header from "./Header";
import { openSelectLinkTargetOverlay } from "./SelectLinkTargetOverlay";

const DeleteAction = {
  initial: "delete-row/initial",
  delete: "delete-row/just-delete",
  merge: "delete-row/merge"
};

const NoActionSelected = { action: DeleteAction.initial };
const JustDelete = rowToDeleteId => ({
  action: DeleteAction.delete,
  rowToDeleteId
});
const MergeRows = (rowToDeleteId, mergedLinkTargetId) => ({
  action: DeleteAction.merge,
  rowToDeleteId,
  mergedLinkTargetId
});
const isInitialAction = f.propEq("action", DeleteAction.initial);
const isDeleteAction = f.propEq("action", DeleteAction.delete);
const isMergeAction = f.propEq("action", DeleteAction.merge);
const canSubmitAction = action =>
  isDeleteAction(action) ||
  (isMergeAction(action) && f.isNumber(action.mergedLinkTargetId));

const getHeadline = count => {
  const translationKey = f.isNil(count)
    ? "table:dependent-rows.fetching-dependent-rows"
    : count === 0
    ? "table:dependent-rows.no-dependent-rows-header"
    : "table:dependent-rows.dependent-rows-header";
  return i18n.t(translationKey, { count });
};

const DeleteRowHeader = ({
  headlineKey,
  bodyTextKey,
  buttons,
  linkTargetTitle,
  isWaiting
}) => (
  <>
    <div className="deletion-info__header overlay-subheader__title">
      {i18n.t(headlineKey, { linkTargetTitle })}
    </div>
    <div className="deletion-info__message overlay-subheader__description">
      {i18n.t(bodyTextKey)}
    </div>
    <div className="deletion-info__action-select overlay-subheader__buttons overlay-subheader__buttons--left">
      {buttons.map(({ textKey, onClick, cssClasses, disabled }) => (
        <Button
          key={textKey}
          onClick={onClick}
          disabled={disabled}
          classNames={cssClasses}
          waiting={isWaiting}
          text={i18n.t(textKey)}
        />
      ))}
    </div>
  </>
);
const DeleteRowFooter = ({ deletionAction, onClose, onSubmit, isWaiting }) => {
  const deleteTextKey =
    deletionAction && isMergeAction(deletionAction)
      ? "table:dependent-rows.btn-submit-merge-rows"
      : "table:dependent-rows.btn-submit-delete-row";

  const isSubmitDisabled = !canSubmitAction(deletionAction);

  return (
    <footer className="button-wrapper">
      <div className="action-buttons">
        <Button
          classNames="negative"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          waiting={isWaiting}
          text={i18n.t(deleteTextKey)}
        />
        <Button
          className="neutral"
          onClick={onClose}
          waiting={isWaiting}
          text={i18n.t("common:cancel")}
        />
      </div>
    </footer>
  );
};

const handleShowDeletionSuccess = options => {
  const { deletionAction } = options;

  const prefix = "table:dependent-rows.";
  const isMerge = isMergeAction(deletionAction);
  const headingKey =
    prefix +
    (isMerge ? "merge-rows-success-header" : "delete-row-success-header");
  const messageKey =
    prefix + (isMerge ? "merge-rows-success-body" : "delete-row-success-body");
  const heading = i18n.t(headingKey, options);
  const message = i18n.t(messageKey, options);
  const context = i18n.t(prefix + "delete-row-success-context");

  showDialog({
    type: "info",
    context,
    message,
    heading,
    buttonActions: { positive: [i18n.t("common:ok"), f.noop] }
  });
};

const handleShowDeletionError = err => {
  showDialog({
    type: "important",
    context: i18n.t("common:error"),
    heading: i18n.t("table:error_occured_hl"),
    message: err.message,
    buttonActions: { positive: [i18n.t("common:ok"), f.noop] }
  });
};

const handleDeleteRow = ({
  tableId,
  deletionAction,
  langtag,
  oldRowTitle,
  linkTargetTitle
}) =>
  new Promise((resolve, reject) => {
    const rowId = deletionAction.rowToDeleteId;
    const mergeWithRowId = deletionAction.mergedLinkTargetId;
    const {
      selectedCell: {
        selectedCell: { columnId }
      }
    } = store.getState();

    store.dispatch(
      actions.deleteRow({
        rowId,
        tableId,
        mergeWithRowId,
        onSuccess: () => {
          handleShowDeletionSuccess({
            deletionAction,
            oldRowTitle,
            linkTargetTitle
          });
          resolve();
        },
        onError: err => {
          handleShowDeletionError(err);
          reject(err);
        }
      })
    );

    store.dispatch(
      actions.toggleCellSelection({
        columnId,
        langtag,
        tableId,
        selected: false
      })
    );
  });

const ButtonConfig = (translationKeyPostfix, effect, cssClasses, disabled) => ({
  textKey: `table:dependent-rows.${translationKeyPostfix}`,
  onClick: effect,
  cssClasses,
  disabled: !!disabled
});

const lookupRowDisplayName = (store, tableId, langtag) => rowId => {
  const flattenTranslation = f.compose(
    f.join(" "),
    f.compact,
    f.map(retrieveTranslation(langtag))
  );
  const go = f.compose(
    dv =>
      Array.isArray(dv)
        ? flattenTranslation(dv)
        : retrieveTranslation(langtag, dv),
    f.get(["values", 0]),
    f.find(f.propEq("id", rowId)),
    f.getOr([], ["displayValues", tableId])
  );

  return go(store);
};

const DeleteRowOverlay = props => {
  const [deletionAction, setDeletionAction] = useState(NoActionSelected);
  const [nLinkedTables, setNLinkedTables] = useState();
  const { table, row, langtag, cell } = props;
  const handleHasDependencies = setNLinkedTables;
  const handleHasNoDependencies = () => {
    setNLinkedTables(0);
    setDeletionAction(JustDelete(row.id));
  };
  const [isWaiting, setIsWaiting] = useState(false);
  const dispatch = useDispatch();

  const getRowTitle = lookupRowDisplayName(props.grudData, table.id, langtag);
  const oldRowTitle = getRowTitle(row.id);
  const linkTargetTitle = getRowTitle(deletionAction.mergedLinkTargetId);

  const selectLinkTarget = () => {
    openSelectLinkTargetOverlay({
      row,
      table,
      langtag,
      onSubmit: selectMergeMode,
      selectedTargetRowId: deletionAction.mergedLinkTargetId
    });
  };
  const selectMergeMode = targetId =>
    setDeletionAction(MergeRows(row.id, targetId));
  const selectDeleteMode = () => setDeletionAction(JustDelete(row.id));
  const submitDeleteAction = isInitialAction(deletionAction)
    ? f.noop
    : () => {
        setIsWaiting(true);
        handleDeleteRow({
          tableId: table.id,
          langtag,
          deletionAction,
          oldRowTitle,
          linkTargetTitle
        })
          .finally(() => setIsWaiting(false))
          .then(() => dispatch(actions.closeOverlay(String(props.name))));
      };

  const headerConfig = {
    [DeleteAction.initial]: {
      headlineKey: getHeadline(nLinkedTables),
      bodyTextKey: `table:dependent-rows.delete-${
        nLinkedTables === 0 ? "no-" : ""
      }dependent-rows`,
      buttons: [
        ButtonConfig("btn-select-delete-row", selectDeleteMode, "negative"),
        ButtonConfig("btn-select-merge-rows", selectLinkTarget, "default")
      ]
    },
    [DeleteAction.delete]: {
      headlineKey: "table:dependent-rows.confirm-delete-header",
      bodyTextKey: "table:dependent-rows.confirm-delete-body",
      buttons: [
        ButtonConfig("btn-submit-delete-row", submitDeleteAction, "negative"),
        ButtonConfig("btn-select-merge-rows", selectLinkTarget, "default")
      ]
    },
    [DeleteAction.merge]: {
      headlineKey: "table:dependent-rows.confirm-merge-header",
      bodyTextKey: "table:dependent-rows.confirm-merge-body",
      buttons: [
        ButtonConfig(
          "btn-submit-merge-rows",
          submitDeleteAction,
          "negative",
          !canSubmitAction(deletionAction)
        ),
        ButtonConfig(
          "btn-change-link-target",
          selectLinkTarget,
          "default skeleton"
        )
      ]
    }
  };

  const wrapperCssClass = buildClassName("delete-row-confirmation", {
    greyout: !isInitialAction(deletionAction)
  });

  return (
    <div className={wrapperCssClass}>
      <section className="overlay-subheader">
        <DeleteRowHeader
          {...f.get(deletionAction.action, headerConfig)}
          oldRowTitle={oldRowTitle}
          linkTargetTitle={linkTargetTitle}
          isWaiting={isWaiting}
        />
      </section>
      <DependentRowsList
        cell={cell}
        className="item"
        hasDependency={handleHasDependencies}
        hasNoDependency={handleHasNoDependencies}
        langtag={langtag}
        row={row}
        table={table}
      />
      <DeleteRowFooter
        isWaiting={isWaiting}
        deletionAction={deletionAction}
        onClose={props.actions.closeOverlay}
        onSubmit={submitDeleteAction}
      />
    </div>
  );
};

const ViewDependentRowsOverlay = props => {
  const { table, row, langtag, cell } = props;

  return (
    <div className="delete-row-confirmation">
      <DependentRowsList
        className="item"
        table={table}
        row={row}
        langtag={langtag}
        cell={cell}
      />
    </div>
  );
};

ViewDependentRowsOverlay.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  deleteInfo: PropTypes.bool
};

export function confirmDeleteRow({ row, table, langtag }) {
  store.dispatch(
    actions.openOverlay({
      head: (
        <Header
          context={i18n.t("table:delete_row")}
          title={
            <OverlayHeadRowIdentificator
              langtag={langtag}
              cell={{ table, row }}
            />
          }
        />
      ),
      body: (
        <DeleteRowOverlay
          row={row}
          table={table}
          langtag={langtag}
          cell={{ row, table, langtag }}
        />
      ),
      type: "full-height"
    })
  );
}

export function openShowDependency({ table, row, langtag, cell }) {
  store.dispatch(
    actions.openOverlay({
      head: (
        <Header
          context={i18n.t("table:dependencies")}
          title={<OverlayHeadRowIdentificator langtag={langtag} cell={cell} />}
        />
      ),
      body: (
        <ViewDependentRowsOverlay
          row={row}
          table={table}
          langtag={langtag}
          cell={cell}
        />
      ),
      type: "full-height"
    })
  );
}
