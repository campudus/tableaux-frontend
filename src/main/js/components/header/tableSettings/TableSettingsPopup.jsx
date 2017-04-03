/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React from "react";
import NameEditor from "./NameEditor";
import listensToClickOutside from "react-onclickoutside";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";
import i18n from "i18next";
import classNames from "classnames";
import {setRowAnnotation} from "../../../helpers/annotationHelper";
import Cookies from "js-cookie";

@listensToClickOutside
class TableSettingsPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selected: null};
  }

  handleClickOutside = evt => {
    this.props.outsideClickHandler(evt);
  };

  menuItemContents = () => {
    const {table, langtag} = this.props;
    const setAllRowsFinal = () => {
      setRowAnnotation({final: true}, table);
      Cookies.remove(`table-${table.id}`);
    };
    return [
      <a href="#" onClick={setAllRowsFinal}>{i18n.t("table:final.set_all_rows_final")}</a>,
      (isUserAdmin()) ? <NameEditor table={table} langtag={langtag} /> : null
    ];
  };

  render() {
    return (
      <div id="table-settings-popup">
        {this.menuItemContents()
             .map(
               (item, id) => {
                 const cssClass = classNames("menu-item", {"active": this.state.selected === id});
                 return <div key={id} className={cssClass} onMouseEnter={() => this.setState({selected: id})}>{item}</div>;
               }
             )
        }
      </div>
    );
  }
}

TableSettingsPopup.propTypes = {
  table: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  outsideClickHandler: React.PropTypes.func.isRequired
};

module.exports = TableSettingsPopup;
