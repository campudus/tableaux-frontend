import React from 'react';
import NavigationPopup from './NavigationPopup';
import listensToClickOutside from 'react-onclickoutside/decorator';
const NavigationPopupWithClickOutside = listensToClickOutside(NavigationPopup);

class Navigation extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired
  };

  state = {
    navigationOpen : false
  };

  handleClickOutside = (event) => {
    this.setState({navigationOpen : false});
  };

  mainNavButtonClicked = (e) => {
    e.preventDefault();
    this.setState({navigationOpen : !this.state.navigationOpen});
  };

  render = () => {
    const {navigationOpen} = this.state;
    const {langtag} = this.props;

    return (
      <nav id="main-navigation-wrapper" className={navigationOpen ? "active": ""}>
        <a id="burger" className="ignore-react-onclickoutside" href="#" onClick={this.mainNavButtonClicked}>
          <i className="fa fa-bars"></i>
        </a>
        {navigationOpen ?
          <NavigationPopupWithClickOutside
            langtag={langtag}
            onClickOutside={this.handleClickOutside}/> : null}
      </nav>
    )
  }
}

export default Navigation;