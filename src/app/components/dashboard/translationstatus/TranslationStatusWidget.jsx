import React from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import {Langtags} from "../../../constants/TableauxConstants";
import {pure} from "recompose";
import f from "lodash/fp";
import {doto} from "../../../helpers/functools";
import CircleGraph from "./CircleGraph";
import Spinner from "../../header/Spinner";

// const Langtags = ["de", "en", "en-US", "ch-IT", "fr"]; // for storybook

const TranslationStatusWidget = ({requestedData}) => (
  <div className="translation-status">
    <React.Fragment>
      <div className="heading">{i18n.t("dashboard:translation.heading") || "Translation status"}</div>

      {(f.isNil(requestedData))

        ? (
          <Spinner isLoading
                   customOptions={{color: "#eee"}}
          />
        )

        : (
          <div className="content">
            {f.map(
              (lt) => {
                const perc = f.getOr(0, ["translationStatus", lt], requestedData) * 100;
                return (
                  <div className="circle-chart"
                       key={lt}
                  >
                    <CircleGraph percent={perc} />
                    <div className="langtag">{doto(lt, f.takeRight(2), f.join(""))}</div>
                  </div>
                );
              }, f.tail(Langtags))
            }
          </div>
        )
      }

    </React.Fragment>
  </div>
);

TranslationStatusWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default pure(TranslationStatusWidget);
