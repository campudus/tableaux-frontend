import React, {Component, PropTypes} from "react";
import {broadcastRowLoaded} from "../../../actions/ActionCreator";
import {ActionTypes} from "../../../constants/TableauxConstants";
import Dispatcher from "../../../dispatcher/Dispatcher";
import Header from "../Header";
import {showDialog} from "../GenericOverlay";
import {maybe} from "../../../helpers/monads";
import i18n from "i18next";
import * as f from "lodash/fp";
import EntityViewBody from "./EntityViewBody";
import mkHeaderComponents, {getDisplayLabel, getTableName} from "./EntityViewHeader";
import ActionCreator from "../../../actions/ActionCreator";

class LoadingEntityViewHeaderWrapper extends Component {
  static propTypes = {
    row: PropTypes.object,
    overlayId: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {row: props.row || null};
  }

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.ENTITY_VIEW_ROW_LOADED, this.handleRowLoaded);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.ENTITY_VIEW_ROW_LOADED, this.handleRowLoaded);
  };

  handleRowLoaded = ({overlayId, row}) => {
    if (this.props.overlayId === overlayId) {
      this.setState({row});
    }
    ActionCreator.changeHeaderTitle({id: overlayId, title: getDisplayLabel(row, this.props.langtag)})
  };

  render() {
    const {overlayId, langtag} = this.props;
    const {row} = this.state;
    const elements = (row)
      ? {
        context: getTableName(row, langtag),
        title: getDisplayLabel(row, langtag),
        components: mkHeaderComponents(overlayId, row, langtag),
        langtag
      }
      : {
        context: "",
        title: i18n.t("table:loading"),
        components: <div />,
        langtag
      };
    return <Header {...elements} id={this.props.overlayId}/>
  }
}

class LoadingEntityViewBodyWrapper extends Component {
  static propTypes = {
    overlayId: PropTypes.number.isRequired,
    toLoad: PropTypes.object,
    row: PropTypes.object,
    langtag: PropTypes.string.isRequired,
    focusElementId: PropTypes.any
  };

  constructor(props) {
    super(props);
    const {toLoad, row} = props;
    if ((!!toLoad ^ !!row) !== 1) {
      console.error("EntityView: Need to specify either a row to load or a loaded row");
    }

    if (toLoad) {
      const setLoadedRow = row => {
        this.setState({row});
        broadcastRowLoaded({
          overlayId: this.props.overlayId,
          row
        })
      };
      this.state = {row: null};
      this.loadRow(toLoad)
          .then(setLoadedRow)
          .catch(
            error => {
              console.error(error);
              showDialog({
                type: "warning",
                context: "Error",
                title: "Could not load row",
                heading: "An error occured while fetching row from database",
                message: error.toString(),
                actions: {neutral: ["Ok", null]}
              });
            });
    } else {
      this.state = {row: props.row};
    }
  }

  loadRow = ({table, tables, tableId, rowId}) => {
    const targetTable = maybe(tables)
      .exec("get", tableId)
      .getOrElse(table);

    const loadColumns = () => new Promise(
      (resolve, reject) => {
        const tableMonad = maybe(targetTable)
          .map(f.prop("columns"))
          .exec("fetch", {
            reset: true,
            success: resolve,
            error: e => {
              reject("Error initialising table columns:", e)
            }
          });
        if (tableMonad.isNone) {
          reject("No table to load row from");
        }
      }
    );

    const loadRow = () => new Promise(
      (resolve, reject) => {
        targetTable.rows.fetchById(rowId, (err, row) => {
          if (err) {
            reject("Could not retrieve row with proper Id");
          } else {
            resolve(row);
          }
        })
      }
    );

    return new Promise(
      (resolve, reject) => {
        loadColumns()
          .then(loadRow)
          .then(result => (result) ? resolve(result) : reject("Could not load desired row"))
          .catch(console.error)
      }
    );
  };

  render() {
    const {row} = this.state;
    return (row)
      ? <EntityViewBody row={row} langtag={this.props.langtag} overlayId={this.props.overlayId}
                        registerForEvent={this.props.registerForEvent}
      />
      : null
  }
}

export {LoadingEntityViewBodyWrapper, LoadingEntityViewHeaderWrapper};