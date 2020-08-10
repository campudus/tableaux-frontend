import { translate } from "react-i18next";
import React from "react";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";

const DuplicatedMessage = props => {
  const { row, t, onJumpToRow } = props;
  const onClickHandler = () => {
    onJumpToRow(row);
  };
  return (
    <div>
      <p>{t("row_duplicated")}</p>
      <a href="#" onClick={onClickHandler}>
        {t("jump_to_row")} <i className="fa fa-angle-right" />
      </a>
    </div>
  );
};

const TranslatedDuplicatedMessage = translate(["table"])(DuplicatedMessage);

export function duplicateRow(payload) {
  return new Promise((resolve, reject) => {
    store.dispatch(
      actions.duplicateRow({
        ...payload,
        DuplicatedMessage: TranslatedDuplicatedMessage,
        onSuccess: resolve,
        onError: reject
      })
    );
  });
}
