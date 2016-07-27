import React from 'react';
import _ from 'lodash';
import TableauxConstants from '../../../constants/TableauxConstants';
import TableSwitcherPopup from './TableSwitcherPopup';

class TableSwitcherButton extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    currentTable : React.PropTypes.object.isRequired
  };

  state = {
    isOpen : false,
    filterGroup : null
  };

  constructor(props) {
    super(props);
  }

  handleClickedOutside = (event) => {
    this.setState({isOpen : false});
  };

  renderPopup = () => {
    const groups = _.uniqBy(_.filter(this.props.tables.map((table) => {
      // map ampersand model to plain group object
      return table && table.group ? table.group : {id : 0}
    }), (group) => {
      // filter all empty groups
      return group.id !== 0
    }), (group) => {
      // unique by group id
      return group.id;
    });

    return <TableSwitcherPopup langtag={this.props.langtag} groups={groups}
                               tables={this.props.tables} currentTable={this.props.currentTable}
                               onClickedOutside={this.handleClickedOutside}
                               onClickedTable={this.handleClickedOutside}
                               currentGroupId={null}/>;
  };

  togglePopup = (event) => {
    event.preventDefault();
    this.setState({isOpen : !this.state.isOpen});
  };

  render() {
    let buttonClass = "button";

    if (this.state.isOpen) {
      buttonClass += " ignore-react-onclickoutside";
    }

    //Show display name with fallback to machine name
    const table = this.props.currentTable;
    const tableDisplayName = table.displayName[this.props.langtag] || (table.displayName[TableauxConstants.FallbackLanguage] || table.name);

    return (
      <div id="tableswitcher-wrapper" className={this.state.isOpen ? "active" : ""}>
        <a href="#" className={buttonClass} onClick={this.togglePopup}>
          <i className="fa fa-columns"></i>{tableDisplayName}</a>
        {this.state.isOpen ? this.renderPopup() : null}
      </div>
    )
  }

}

module.exports = TableSwitcherButton;