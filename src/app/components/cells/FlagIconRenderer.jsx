import React from "react";
import {Langtags} from "../../constants/TableauxConstants";
import {branch, compose, flattenProp, onlyUpdateForKeys, pure, renderNothing} from "recompose";
import f from "lodash/fp";
import TextAnnotationButton from "../textannotations/TextAnnotationButton";

const knownFlags = ["important", "translationNeeded", "check-me", "postpone", "info", "warning", "error"];

const FlagDot = compose(
  branch(
    (props) => !props.show,
    renderNothing
  ),
  pure
)(
  ({flag}) => <div className={flag} />
);

const AnnotationBubble = compose(
  branch(
    ({hasTextAnnotations, isOpen}) => !hasTextAnnotations && !isOpen,
    renderNothing
  ),
  pure
)(
  ({isOpen, cell, annotationState}) => (
    <TextAnnotationButton open={isOpen}
                          cell={cell}
                          annotationState={annotationState}
    />
  )
);

const FlagIconRenderer = onlyUpdateForKeys(["langtags", ...knownFlags, "langtag", "annotationsOpen"])(
  (props) => {
    const {cell, annotations, langtag, annotationsOpen} = props;

    const hasTextAnnotations = f.any(
      f.complement(f.isEmpty),
      [annotations.info, annotations.warning, annotations.error]
    );

    const isTranslationNeeded = f.contains(langtag, f.get(["translationNeeded", "langtags"], annotations))
      && langtag !== Langtags[0];

    return (
      <div className="annotation-flag-icons">
        <AnnotationBubble hasTextAnnotations={hasTextAnnotations}
                          isOpen={annotationsOpen}
                          cell={cell}
                          annotationState={props.annotationsState}
        />
        <FlagDot flag="translation" show={isTranslationNeeded} />
        <FlagDot flag="important" show={annotations.important} />
        <FlagDot flag="check-me" show={annotations["check-me"]} />
        <FlagDot flag="postpone" show={annotations.postpone} />
      </div>
    );
  }
);

const spreadProps = compose(
  flattenProp("annotations"),
  flattenProp("translationNeeded"),
  branch(
    (props) => f.every(x => !x, f.props(knownFlags, props)) && !props.annotationsOpen,
    renderNothing,
  )
);

export default spreadProps(FlagIconRenderer);
