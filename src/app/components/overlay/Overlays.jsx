import React, { Fragment } from "react";
import GenericOverlay from "./GenericOverlay";
import RootButton from "../RootButton";
import TableauxConstants from "../../constants/TableauxConstants";
import Toast from "./Toast";
import withReduxState from "../../helpers/reduxActionHoc";

const OverlayRenderer = ({ overlays, toast, actions }) => {
  console.log("OverlayRenderer", overlays, toast);
  return (
    <Fragment>
      {overlays.map((overlayParams, idx) => (
        <GenericOverlay
          {...overlayParams}
          isOnTop={idx === topIndex}
          specialClass={getSpecialClass(idx)}
          actions={actions}
        />
      ))}
      <RootButton
        closeOverlay={() => null}
        activeOverlays={overlays.activeOverlays || []}
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
  // <RootButton
  //   closeOverlay={closeOverlay}
  //   activeOverlays={activeOverlays}
  // />
};

const mapStateToProps = state => {
  const toast = (state.overlays && state.overlays.toast) || null;
  const overlays = (state.overlays && state.overlays.overlays) || [];
  return { toast, overlays };
};

// TODO: Stop hiding toast when user hovers over the toast message
const showToast = payload => {
  if (f.isEmpty(payload)) {
    hideToast();
  }
  // default 2700ms
  const { content, milliseconds = 2700 } = payload;

  this.setState({
    toast: content
  });

  if (this.toastTimer) {
    clearInterval(this.toastTimer);
  }

  this.toastTimer = setTimeout(this.hideToast, milliseconds);
};

const hideToast = () => {
  this.toastTimer = null;
  this.setState({
    toast: null
  });
};

const renderActiveOverlays = () => {
  let overlays = this.state.activeOverlays;
  if (f.isEmpty(overlays)) {
    return null;
  }

  const bigOverlayIdces = overlays
    .map((ol, idx) => (ol.type === "full-height" ? idx : null))
    .filter(f.isInteger); // 0 is falsy
  const nonExitingOverlays = f.reject(
    ii => f.contains(overlays[ii].id, this.exitingOverlays),
    bigOverlayIdces
  );

  const getSpecialClass = idx => {
    const left = f.dropRight(1)(
      f.intersection(bigOverlayIdces, nonExitingOverlays)
    );
    const isExitingOverlay = idx =>
      f.contains(overlays[idx].id, this.exitingOverlays);
    const followsAfterExitingOverlay = idx => {
      return nonExitingOverlays.length < 2
        ? false
        : overlays[f.last(nonExitingOverlays)].id === overlays[idx].id;
    };
    const shouldBeRightAligned = idx => {
      return (
        followsAfterExitingOverlay(idx) ||
        (f.isEmpty(this.exitingOverlays) && f.last(bigOverlayIdces) === idx)
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
    f.reject(idx => f.contains(overlays[idx].id, this.exitingOverlays)),
    f.last
  )(overlays.length);

  return overlays.map((overlayParams, idx) => {
    return (
      <GenericOverlay
        {...overlayParams}
        key={`overlay-${idx}`}
        isOnTop={idx === topIndex}
        specialClass={getSpecialClass(idx)}
      />
    );
  });
};

const openOverlay = content => {
  this.hideToast();
  const { currentViewParams, activeOverlays } = this.state;
  const timestamp = new Date().getTime();
  const namedContent = f.isNil(content.name)
    ? f.assoc("name", timestamp, content)
    : content;
  this.setState({
    activeOverlays: [...activeOverlays, f.assoc("id", timestamp, namedContent)],
    currentViewParams: f.assoc("overlayOpen", true, currentViewParams)
  });
};

const closeOverlay = name => {
  return new Promise((resolve, reject) => {
    const { currentViewParams, activeOverlays } = this.state;
    const overlayToClose = f.isString(name)
      ? f.find(f.matchesProperty("name", name), activeOverlays)
      : f.flow(
          f.reject(ol => f.contains(ol.id, this.exitingOverlays)),
          f.last
        )(activeOverlays);
    if (!overlayToClose) {
      resolve();
    }
    const fullSizeOverlays = activeOverlays.filter(
      f.matchesProperty("type", "full-height")
    );
    if (fullSizeOverlays.length > 1 && overlayToClose.type === "full-height") {
      // closing a right-aligned full-height overlay
      const removeOverlayAfterTimeout = () => {
        const { activeOverlays } = this.state;
        this.exitingOverlays = f.reject(
          f.eq(overlayToClose.id),
          this.exitingOverlays
        );
        this.setState({
          exitingOverlays: !f.isEmpty(this.exitingOverlays),
          activeOverlays: f.reject(
            f.matchesProperty("id", overlayToClose.id),
            activeOverlays
          ),
          currentViewParams: f.assoc(
            "overlayOpen",
            activeOverlays.length > 1,
            currentViewParams
          )
        });
      };
      this.exitingOverlays = [...this.exitingOverlays, overlayToClose.id];
      this.setState({ exitingOverlays: true }, resolve);
      window.setTimeout(removeOverlayAfterTimeout, 400);
    } else {
      this.setState(
        {
          activeOverlays: f.dropRight(1, activeOverlays),
          currentViewParams: f.assoc(
            "overlayOpen",
            activeOverlays.length > 1,
            currentViewParams
          )
        },
        resolve
      );
    }
  });
};

export default withReduxState(OverlayRenderer, mapStateToProps);
