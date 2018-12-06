import React from "react";
import PropTypes from "prop-types";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import f from "lodash/fp";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import {Langtags} from "../../../constants/TableauxConstants";
import {compose, pure, withHandlers, withStateHandlers} from "recompose";

const SFTIInputField = compose(
  pure,
  withHandlers({
    handleChange: ({setFileAttribute, name, langtag}) => (event) => {
      setFileAttribute(name, langtag, f.getOr("", ["target", "value"], event));
    },
    stopPropagation: () => (event) => event.stopPropagation()
  })
)(
  ({name, value, langtag, handleToggle, handleChange, stopPropagation}) => (
    <div className="item">
      <div className="item-content">
        <div onClick={handleToggle}>
          {getLanguageOrCountryIcon(langtag)}
        </div>
        <input disabled={!hasUserAccessToLanguage(langtag)}
               type={"text"}
               value={f.getOr("", langtag, value)}
               onChange={handleChange}
               onClick={stopPropagation}
        />
      </div>
    </div>
  )
);

const SingleFileTextInput = (props) => {
  const {
    labelText,
    langtag,
    isOpen,
    name,
    handleToggle,
    handleChange,
    setFileAttribute,
    value
  } = props;
  return (
    <div className="item-contents"
         onClick={handleToggle}
    >
      <div className="item-header">{labelText}</div>
      {Langtags
        .filter(
          (lt) => isOpen || lt === langtag // true if all open or this is current langtag
        )
        .map(
          (lt) => (
            <SFTIInputField key={lt}
                            name={name}
                            value={value}
                            langtag={lt}
                            onChange={handleChange}
                            setFileAttribute={setFileAttribute}
            />
          )
        )
      }
    </div>
  );
};

export default compose(
  pure,
  withStateHandlers(
    () => ({isOpen: false}),
    {
      handleToggle: ({isOpen}) => () => ({isOpen: !isOpen})
    }
  )
)(SingleFileTextInput);

SingleFileTextInput.propTypes = {
  name: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
  langtag: PropTypes.string.isRequired,
  setFileAttribute: PropTypes.func.isRequired
};
