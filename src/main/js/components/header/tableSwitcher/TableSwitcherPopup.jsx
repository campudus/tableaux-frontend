import React from 'react';
import listensToClickOutside from 'react-onclickoutside/decorator';
import ActionCreator from '../../../actions/ActionCreator';
import TableauxConstants from '../../../constants/TableauxConstants';
import _ from 'lodash';
import KeyboardShortcutsHelper from '../../../helpers/KeyboardShortcutsHelper';
import ReactDOM from 'react-dom';
import {translate} from 'react-i18next';

@translate(['header'])
@listensToClickOutside()
class SwitcherPopup extends React.Component {

  static propTypes = {
    onClickedOutside : React.PropTypes.func.isRequired,
    onClickedTable : React.PropTypes.func.isRequired,
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    groups : React.PropTypes.array.isRequired,
    currentTable : React.PropTypes.object.isRequired,
    currentGroupId : React.PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      filterGroupId : props.currentGroupId && _.isFinite(props.currentGroupId) ? props.currentGroupId : null,
      filterTableName : "",
      focusTableId : props.currentTable ? props.currentTable.id : null
    };
  }

  componentDidMount() {
    // scroll to current focus table (initially its the current table)
    if (this.state.focusTableId !== null && this.refs['table' + this.state.focusTableId]) {
      ReactDOM.findDOMNode(this.refs['table' + this.state.focusTableId]).focus();
    }

    // focus on filter input
    ReactDOM.findDOMNode(this.refs.filterInput).focus();
  }

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  onClickGroup = (group) => {
    this.setState({
      filterGroupId : this.state.filterGroupId === group.id ? null : group.id,
      filterTableName : ""
    })
  };

  onClickTable = (table) => {
    //prevents undefined tableId: we just want to switch the table when there is actually something selected
    if (!_.isEmpty(table)) {
      this.props.onClickedTable(null);
      ActionCreator.switchTable(table.id, this.props.langtag);
    }
  };

  filterInputChange = (event) => {
    this.setState({filterTableName : event.target.value});
  };

  filterUpdate = (event) => {
    if (this.getFilteredTables().length === 1) {
      this.onClickTable(this.getFilteredTables()[0]);
    }
  };

  getKeyboardShortcutsFilterTable = (event) => {
    return {
      enter : (event) => {
        this.filterUpdate(event);
      },
      escape : (event) => {
        this.filterInputChange({target : {value : ""}})
      }
    };
  };

  getFilteredTables = () => {
    const self = this;
    const tables = this.props.tables.models;

    // filter tables step 1: only tables in selected group
    const filteredTablesByGroup = _.filter(tables, (table) => {
      if (this.state.filterGroupId) {
        return table.group.id === self.state.filterGroupId
      } else {
        return true;
      }
    });

    // filter tables step 2: only tables with name which contains current filter
    const filteredTablesByName = _.filter(filteredTablesByGroup, (table) => {
      const tableDisplayName = table.displayName[self.props.langtag] || (table.displayName[TableauxConstants.FallbackLanguage] || table.name);

      let filterTableName = self.state.filterTableName ? self.state.filterTableName.toLowerCase() : null;
      return _.every(_.words(filterTableName), function (word) {
        return tableDisplayName.toLowerCase().indexOf(word) > -1 || table.name.toLowerCase().indexOf(word) > -1;
      });
    });

    return filteredTablesByName;
  };

  renderGroups = (groups) => {
    const self = this;
    const {t} = this.props;

    const renderedGroups = _.map(groups, function (group, index) {
      const groupDisplayName = group.displayName[self.props.langtag] || group.displayName[TableauxConstants.FallbackLanguage];

      const isActive = self.state.filterGroupId === group.id;

      const onClickFn = () => {
        self.onClickGroup(group);
      };

      return (
        <li key={"group" + index} onClick={onClickFn} className={isActive ? "active" : ""}>
          {groupDisplayName}
          {isActive ? <i className="fa fa-times-circle"></i> : ""}
        </li>
      );
    });

    if (groups.length === 0) {
      return "";
    } else {
      return (
        <div className="tableswitcher-groups">
          <div className="tableswitcher-label"><i className="fa fa-filter"></i> {t('tableSwitcher.groups')}</div>

          <ul>
            {renderedGroups}
          </ul>
        </div>
      );
    }
  };

  renderTables = (groups, tables) => {
    const self = this;
    const {t} = this.props;

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

      return (<li key={"table" + index} className={isActive ? 'active' : ''} onClick={onClickFn}
                  onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(onKeyDownFn)} tabIndex="0"
                  ref={"table" + table.id}>{tableDisplayName}</li>);
    });

    const style = groups.length === 0 ? {width : "100%"} : {};

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
    const groups = this.props.groups;
    const tables = this.getFilteredTables();

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