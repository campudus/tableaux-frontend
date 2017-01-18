import React from 'react';
import FilterPopup from './FilterPopup.jsx';
import {translate} from 'react-i18next';
import * as _ from "lodash/fp"

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
    this.setState({open : false});
  };

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
  };

  render() {
    let {t} = this.props;
    let buttonClass = "button";

    if (this.state.open) {
      buttonClass += " ignore-react-onclickoutside";
    }

    const css_class = _.compose(
      _.first,
      _.first,
      _.filter(x => x[1]),
      _.zip(["active", "has-filter", ""])
    )([this.state.open, this.props.currentFilter, true])

    return (
      <div id="filter-wrapper" className={css_class}>
        <a href="#" className={buttonClass} onClick={this.toggleFilter}>
          <i className="fa fa-filter"></i>{t('button.title')}</a>
        {this.renderFilterPopup()}
      </div>
    )
  }

}

export default translate(['filter'])(FilterButton);