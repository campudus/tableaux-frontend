import React, { Fragment } from "react";
import GenericOverlay from "./GenericOverlay";
import RootButton from "../RootButton";
import Toast from "./Toast";
import withReduxState from "../../helpers/reduxActionHoc";
import f from "lodash/fp";

const OverlayRenderer = ({
  overlays,
  toast,
  actions,
  columns,
  rows,
  tables
}) => {
  const renderActiveOverlays = () => {
    if (f.isEmpty(overlays)) {
      return null;
    }

    const exitingOverlays = overlays.filter(f.propEq("exiting", true));
    const bigOverlayIdces = overlays
      .map((ol, idx) => (ol.type === "full-height" ? idx : null))
      .filter(f.isInteger); // 0 is falsy
    const nonExitingOverlays = f.reject(
      ii => f.contains(overlays[ii].id, exitingOverlays),
      bigOverlayIdces
    );

    const getSpecialClass = idx => {
      const left = f.dropRight(1)(
        f.intersection(bigOverlayIdces, nonExitingOverlays)
      );
      const isExitingOverlay = idx =>
        f.contains(overlays[idx].id, exitingOverlays);
      const followsAfterExitingOverlay = idx => {
        return nonExitingOverlays.length < 2
          ? false
          : overlays[f.last(nonExitingOverlays)].id === overlays[idx].id;
      };
      const shouldBeRightAligned = idx => {
        return (
          followsAfterExitingOverlay(idx) ||
          (f.isEmpty(exitingOverlays) && f.last(bigOverlayIdces) === idx)
        );
      };
      const shouldBeLeftAligned = idx => f.contains(idx, left);

      return f.cond([
        [isExitingOverlay, f.always("is-right is-exiting")],
        [() => bigOverlayIdces.length < 2, f.noop],
        [shouldBeRightAligned, f.always("is-right")],
        [shouldBeLeftAligned, f.always("is-left")],
        [f.stubTrue, f.noop]
      ])(idx);
    };

    const topIndex = f.flow(
      f.range(0),
      f.reject(idx => f.contains(overlays[idx].id, exitingOverlays)),
      f.last
    )(overlays.length);

    const grudData = {
      columns: columns,
      rows: rows,
      tables: tables
    };

    return overlays.map((overlayParams, idx) => {
      return (
        <GenericOverlay
          {...overlayParams}
          key={`overlay-${idx}`}
          isOnTop={idx === topIndex}
          grudData={grudData}
          actions={actions}
          specialClass={getSpecialClass(idx)}
        />
      );
    });
  };

  return (
    <Fragment>
      {renderActiveOverlays()}
      <RootButton
        closeOverlay={actions.closeOverlay}
        activeOverlays={overlays || []}
      />
      {toast ? (
        <Toast
          content={toast.content}
          actions={actions}
          duration={toast.duration}
        />
      ) : null}
    </Fragment>
  );
};

const mapStateToProps = state => {
  const toast = (state.overlays && state.overlays.toast) || null;
  const overlays = (state.overlays && state.overlays.overlays) || [];
  return { toast, overlays, ...f.pick(["columns", "rows", "tables"], state) };
};

export default withReduxState(OverlayRenderer, mapStateToProps);
