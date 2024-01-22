import React from "react";
import { clearMultilangCell } from "../../redux/actions/cellActions";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";
import i18n from "i18next";
import Header from "./Header";
import Footer from "./Footer";
import { MultilangCellChangeInfo } from "./PasteMultilanguageCellInfo";
import { DefaultLangtag } from "../../constants/TableauxConstants";

export const showClearCellDialog = action => {
  const { cell, oldValue } = action;
  const handleClearCell = () => {
    clearMultilangCell(cell);
  };

  const buttonActions = {
    neutral: [i18n.t("common:cancel")],
    negative: [i18n.t("common:delete_yes_explicit"), handleClearCell]
  };
  store.dispatch(
    actions.openOverlay({
      head: <Header title={i18n.t("table:clear-cell.title")} />,
      body: (
        <MultilangCellChangeInfo
          cell={cell}
          headingText={i18n.t("table:clear-cell.confirmation")}
          kind="default"
          messageText={i18n.t("table:clear-cell.description")}
          newVals={Object.fromEntries(
            Object.keys(oldValue)
              .filter(lt => lt !== DefaultLangtag)
              .map(lt => [lt, null])
          )}
          oldVals={oldValue}
        />
      ),
      footer: <Footer buttonActions={buttonActions} />
    })
  );
};
