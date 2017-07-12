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
import EntityViewHeader from "./EntityViewHeader";

class LoadingEntityViewHeaderWrapper extends Component {
  static propTypes = {
    row: PropTypes.object,
    id: PropTypes.number.isRequired,
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

  handleRowLoaded = ({id, row}) => {
    if (this.props.id === id) {
      this.setState({row});
    }
  };

  render() {
    const {id, langtag} = this.props;
    const {row} = this.state;
    return (row)
      ? <EntityViewHeader row={row}
                          langtag={langtag}
                          id={id}
                          hasMeaningfulLinks={true}
      />
      : <Header context=""
                title={i18n.t("common:loading")}
                components={<div />}
                langtag={langtag}
                id={id}
      />;
  }
}

class LoadingEntityViewBodyWrapper extends Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    toLoad: PropTypes.object,
    row: PropTypes.object,
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    const {toLoad, row} = props;
    if ((!!toLoad ^ !!row) !== 1) {
      console.error("EntityView: Need to specify either a row to load or a loaded row");
    }

    if (toLoad) {
      this.state = {row: null};
    } else {
      this.state = {row: props.row};
    }
  }

  componentWillMount = () => {
    if (!this.state.row) {
      this.loadRow(this.props.toLoad)
          .then(this.setLoadedRow)
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
    }
  };

  setLoadedRow = row => {
    this.setState({row});
    broadcastRowLoaded({
      id: this.props.id,
      row
    });
  };

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
              reject("Error initializing table columns:", e);
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
        });
      }
    );

    return new Promise(
      (resolve, reject) => {
        loadColumns()
          .then(loadRow)
          .then(result => (result) ? resolve(result) : reject("Could not load desired row"))
          .catch(console.error);
      }
    );
  };

  render() {
    const {row} = this.state;
    return (row)
      ? <EntityViewBody row={row} langtag={this.props.langtag} id={this.props.id}
                        registerForEvent={this.props.registerForEvent} filterColumn={this.props.toLoad.filterColumn}
      />
      : null;
  }
}

export {LoadingEntityViewBodyWrapper, LoadingEntityViewHeaderWrapper};
