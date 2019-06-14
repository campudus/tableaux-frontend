import {
  branch,
  compose,
  onlyUpdateForKeys,
  pure,
  renderNothing
} from "recompose";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { Langtags } from "../../constants/TableauxConstants";
import TextAnnotationButton from "../textannotations/TextAnnotationButton";

const knownFlags = [
  "important",
  "translationNeeded",
  "check-me",
  "postpone",
  "info",
  "warning",
  "error"
];

const FlagDot = compose(
  branch(props => !props.show, renderNothing),
  pure
)(({ flag }) => <div className={flag} />);

const AnnotationBubble = compose(
  branch(
    ({ hasTextAnnotations, isOpen }) => !hasTextAnnotations && !isOpen,
    renderNothing
  ),
  pure
)(({ isOpen, cell, annotationState, toggleAnnotationPopup, langtag }) => (
  <TextAnnotationButton
    open={isOpen}
    cell={cell}
    annotationState={annotationState}
    togglePopup={toggleAnnotationPopup}
    langtag={langtag}
  />
));

const FlagIconRenderer = onlyUpdateForKeys([
  "langtags",
  ...knownFlags,
  "langtag",
  "annotationsOpen",
  "cell"
])(props => {
  const {
    cell,
    cell: { annotations = [] },
    langtag,
    annotationsOpen,
    toggleAnnotationPopup
  } = props;

  const hasTextAnnotations = f.any(f.complement(f.isEmpty), [
    annotations.info,
    annotations.warning,
    annotations.error
  ]);

  const isTranslationNeeded =
    f.contains(
      langtag,
      f.get(["translationNeeded", "langtags"], annotations)
    ) && langtag !== Langtags[0];

  return (
    <div className="annotation-flag-icons">
      <AnnotationBubble
        hasTextAnnotations={hasTextAnnotations}
        isOpen={annotationsOpen}
        cell={cell}
        annotationState={props.annotationsState}
        toggleAnnotationPopup={toggleAnnotationPopup}
        langtag={langtag}
      />
      <FlagDot flag="translation" show={isTranslationNeeded} />
      <FlagDot flag="important" show={annotations.important} />
      <FlagDot flag="check-me" show={annotations["check-me"]} />
      <FlagDot flag="postpone" show={annotations.postpone} />
    </div>
  );
});

const enhance = compose(
  branch(props => {
    return (
      !props.annotationsOpen &&
      f.every(
        f.isEmpty,
        f.flow(
          f.prop(["cell", "annotations"]),
          f.props(knownFlags)
        )(props)
      )
    );
  }, renderNothing)
);

export default enhance(FlagIconRenderer);

FlagIconRenderer.propTypes = {
  isOpen: PropTypes.bool,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  annotationState: PropTypes.string.isRequired,
  toggleAnnotationPopup: PropTypes.func.isRequired
};
