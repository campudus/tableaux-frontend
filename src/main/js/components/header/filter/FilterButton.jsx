import React from 'react';
import FilterPopup from './FilterPopup.jsx';

class FilterButton extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    table : React.PropTypes.object.isRequired,
    currentFilter : React.PropTypes.object
  };

  state = {
    open : false
  };

  constructor(props) {
    super(props);
  }

  handleClickedOutside = (event) => {
    console.log("clicked outside of filter: ", event.target);
    this.setState({open : false});
  }

  renderFilterPopup() {
    if (this.state.open) {
      return (
        <FilterPopup langtag={this.props.langtag} onClickedOutside={this.handleClickedOutside}
                     columns={this.props.table.columns} currentFilter={this.props.currentFilter}/>
      );
    } else {
      return null;
    }
  }

  toggleFilter = (event) => {
    event.preventDefault();
    this.setState({open : !this.state.open});
  }

  render() {
    console.log("render filter button");

    var buttonClassName = "button";
    if (this.state.open) {
      buttonClassName += " ignore-react-onclickoutside";
    }

    return (
      <div id="filter-wrapper" className={this.state.open ? "active": ""}>
        <a href="#" className={buttonClassName} onClick={this.toggleFilter}>
          <i className="fa fa-filter"></i>Filtern & Sortieren</a>
        {this.renderFilterPopup()}
      </div>
    )
  }

}

export default FilterButton;