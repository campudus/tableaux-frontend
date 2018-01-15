import React from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
// import {Langtags} from "../../../constants/TableauxConstants";
import {compose, pure, withProps} from "recompose";
import f from "lodash/fp";
import {doto} from "../../../helpers/functools";
import CircleGraph from "./CircleGraph";

const Langtags = ["de", "en", "en-US", "ch-IT", "fr"];

const TranslationStatusWidget = ({requestedData}) => (
  <div className="translation-status">
    <div className="heading">{i18n.t("dashboard.translation:heading") || "Translation status"}</div>

    <div className="content">
      {f.map(
        (lt) => {
          const perc = f.getOr(Math.random() * 100, ["translation", lt], requestedData);
          return (
            <div className="circle-chart"
                 key={lt}
            >
              <CircleGraph percent={perc} />
              <div className="langtag">{doto(lt, f.takeRight(2), f.join(""))}</div>
            </div>
          );
        }, Langtags)
      }
    </div>
  </div>
);

TranslationStatusWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

// TODO: fetch real data from endpoint

const enhance = compose(
  pure,
  withProps({
    requestedData: {
      translation: {}
    }
  })
);

export default enhance(TranslationStatusWidget);
