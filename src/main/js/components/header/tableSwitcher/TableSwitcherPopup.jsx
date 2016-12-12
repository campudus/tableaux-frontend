import React from 'react';
import listensToClickOutside from 'react-onclickoutside/decorator';
import TableauxConstants from '../../../constants/TableauxConstants';
import * as _ from 'lodash';
import KeyboardShortcutsHelper from '../../../helpers/KeyboardShortcutsHelper';
import ReactDOM from 'react-dom';
import {translate} from 'react-i18next';

@translate(['header'])
@listensToClickOutside()
class SwitcherPopup extends React.Component {

  static propTypes = {
    onClickedOutside : React.PropTypes.func.isRequired,
    onClickedTable : React.PropTypes.func.isRequired,
    onClickedGroup : React.PropTypes.func.isRequired,
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    groups : React.PropTypes.array.isRequired,
    currentTable : React.PropTypes.object.isRequired,
    currentGroupId : React.PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      filterGroupId : props.currentGroupId !== null && _.isFinite(props.currentGroupId) ? props.currentGroupId : null,
      filterTableName : "",
      focusTableId : props.currentTable ? props.currentTable.id : null
    };
  }

  componentDidMount = () => {
    // scroll to current focus table (initially its the current table)
    if (this.state.focusTableId !== null && this.refs['table' + this.state.focusTableId]) {
      ReactDOM.findDOMNode(this.refs['table' + this.state.focusTableId]).focus();
    }

    // focus on filter input
    const filterInput = ReactDOM.findDOMNode(this.refs.filterInput);
    filterInput.focus();
  };

  componentDidUpdate = (prevProps, prevState) => {
    this.componentDidMount();
  };

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  onClickGroup = (group) => {
    const groupId = group && group.id ? group.id : null;

    this.props.onClickedGroup(groupId);

    this.setState({
      filterGroupId : this.state.filterGroupId === groupId ? null : groupId,
      filterTableName : ""
    });

    // focus on filter input
    const filterInput = ReactDOM.findDOMNode(this.refs.filterInput);
    filterInput.focus();
  };

  onClickTable = (table) => {
    this.props.onClickedTable(table);
    this.setState({
      focusTableId : table.id
    });
  };

  filterInputChange = (event) => {
    const filteredTables = this.getFilteredTables(this.state.filterGroupId, event.target.value);
    const focusTableId = (filteredTables.length > 0) ? filteredTables[0].id : this.props.currentTable.id;

    this.setState({
      focusTableId : focusTableId,
      filterTableName : event.target.value
    });
  };

  onUpDownNavigation = (nextFocusTableIndexFn) => {
    const filteredTables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);
    const focusTableIndex = _.findIndex(filteredTables, (table) => {
      return table.id === this.state.focusTableId;
    });

    var nextFocusTableIndex = nextFocusTableIndexFn(focusTableIndex);

    if (nextFocusTableIndex >= filteredTables.length) {
      // overflow
      nextFocusTableIndex = 0;
    } else if (nextFocusTableIndex < 0) {
      // underflow
      nextFocusTableIndex = filteredTables.length - 1;
    }

    if (filteredTables.length > nextFocusTableIndex) {
      this.setState({
        focusTableId : filteredTables[nextFocusTableIndex].id
      });
    }
  };

  getKeyboardShortcutsFilterTable = (event) => {
    return {
      // enter on input
      enter : (event) => {
        const filteredTables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);
        if (filteredTables.length > 0) {
          this.onClickTable({id : this.state.focusTableId})
        }
      },
      // clear input
      escape : (event) => {
        this.setState({
          filterTableName : "",
          focusTableId : this.props.currentTable.id
        });
      },
      up : (event) => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();

        this.onUpDownNavigation((focusTableIndex) => {
          return focusTableIndex - 1;
        });
      },
      down : (event) => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();

        this.onUpDownNavigation((focusTableIndex) => {
          return focusTableIndex + 1;
        });
      }
    };
  };

  getFilteredTables = (filterGroupId, filterTableName) => {
    const self = this;
    const tables = this.props.tables.models;

    // filter tables step 1: only tables in selected group
    const filteredTablesByGroup = _.filter(tables, (table) => {
      if (filterGroupId !== null) {
        return table.group.id === filterGroupId
      } else {
        return true;
      }
    });

    // filter tables step 2: only tables with name which contains current filter
    const filteredTablesByName = _.filter(filteredTablesByGroup, (table) => {
      const tableDisplayName = table.displayName[self.props.langtag] || (table.displayName[TableauxConstants.FallbackLanguage] || table.name);

      const filter = filterTableName ? filterTableName.toLowerCase() : null;
      return _.every(_.words(filter), function (word) {
        return tableDisplayName.toLowerCase().indexOf(word) > -1 || table.name.toLowerCase().indexOf(word) > -1;
      });
    });

    return filteredTablesByName;
  };

  renderGroups = (groups) => {
    const self = this;
    const {t, langtag} = this.props;

    const renderedGroups = _.map(groups, function (group, index) {
      const groupDisplayName = group.displayName[langtag] || group.displayName[TableauxConstants.FallbackLanguage];

      const isNoGroupGroup = group.id === 0;
      const isActive = self.state.filterGroupId === group.id;

      const onClickFn = () => {
        self.onClickGroup(group);
      };

      let className = "";
      className += isNoGroupGroup ? " nogroup" : "";
      className += isActive ? " active" : "";

      return (
        <li key={"group" + index} onClick={onClickFn} className={className}>
          {groupDisplayName}
          {isActive ? <i className="fa fa-times-circle"></i> : ""}
        </li>
      );
    });

    if (groups.length <= 1) {
      return "";
    } else {
      return (
        <div className="tableswitcher-groups">
          <div className="tableswitcher-label"><i className="fa fa-filter"></i> {t('tableSwitcher.groups')}</div>

          <div className="tableswitcher-groups-list">
            <ul>
              {renderedGroups}
            </ul>
          </div>
        </div>
      );
    }
  };

  renderTables = (groups, tables) => {
    const self = this;
    const {t, langtag} = this.props;

    const renderedTables = _.map(tables, (table, index) => {
      const tableDisplayName = table.displayName[self.props.langtag] || (table.displayName[TableauxConstants.FallbackLanguage] || table.name);

      const isActive = self.state.focusTableId !== null && self.state.focusTableId === table.id;

      const onClickFn = () => {
        self.onClickTable(table);
      };

      const onKeyDownFn = () => {
        return {
          enter : () => {
            self.onClickTable(table);
          }
        }
      };

      return (
        <li key={"table" + index} className={isActive ? 'active' : ''}
            onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(onKeyDownFn)} tabIndex="0"
            ref={"table" + table.id}>
          <div onClick={onClickFn}>{tableDisplayName}</div>
          <a target="_blank" href={`/${langtag}/table/${table.id}`}><i className="fa fa-external-link"></i></a>
        </li>
      );
    });

    const style = groups.length <= 1 ? {width : "100%"} : {};

    return (
      <div className="tableswitcher-tables" style={style}>
        <div className="tableswitcher-tables-search">
          <div className="tableswitcher-label"><i className="fa fa-columns"></i> {t('tableSwitcher.tables')}</div>

          <div className="tableswitcher-input-wrapper2">
            <div className="tableswitcher-input-wrapper">
              <input value={this.state.filterTableName} placeholder={t('tableSwitcher.search')} type="text"
                     className="tableswitcher-input"
                     ref="filterInput" onChange={this.filterInputChange}
                     onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcutsFilterTable)}
                     autoFocus="true"/>
              <i className="fa fa-search"></i>
            </div>
          </div>
        </div>

        <div className="tableswitcher-tables-list">
          <ul>
            {renderedTables}
          </ul>
        </div>
      </div>
    );
  };

  render() {
    console.log("TableSwitcherPopup.render()");

    const groups = this.props.groups;
    const tables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);

    return (
      <div id="tableswitcher-popup">
        <div id="tableswitcher-popup-internal-wrapper">
          {this.renderGroups(groups)}
          {this.renderTables(groups, tables)}
        </div>
      </div>
    );
  }

}

export default SwitcherPopup;