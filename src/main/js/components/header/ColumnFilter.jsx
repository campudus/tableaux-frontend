import React from "react";
import ColumnFilterPopup from "./ColumnFilterPopup";
import i18n from "i18next";
import classNames from "classnames";
import connectToAmpersand from "../HOCs/connectToAmpersand";

@connectToAmpersand
class ColumnFilter extends React.Component {

  state = {open: false};

  constructor(props) {
    super(props);
    this.props.columns.forEach(col => this.props.watch(col));
  }

  togglePopup = event => {
    event.preventDefault();
    this.setState({open: !this.state.open});
  };

  handleClickedOutside = (event) => {
    event.preventDefault();
    this.setState({open: false});
  };

  render = () => {
    const {langtag, columns} = this.props;
    const {open} = this.state;
    const nHidden = columns.filter(x => !x.visible).length;
    const message = nHidden + " " + i18n.t("table:hidden_items");
    const cssClass = classNames({
      "active": open,
      "has-filter": !open && nHidden > 0
    });

    const buttonClass = classNames(
      "button",
      {"ignore-react-onclickoutside": open}
    );
    return (
      <div id="column-filter-wrapper" className={cssClass}>
        <a href="#" className={buttonClass} onClick={this.togglePopup}>
          <i className="fa fa-eye" />
          {(nHidden > 0)
            ? <text className="infotext">{message}</text>
            : null
          }
        </a>
        {(open)
          ? <ColumnFilterPopup langtag={langtag}
                               close={this.handleClickedOutside}
                               columns={this.props.columns}
          />
          : null
        }
      </div>
    );
  }
}

ColumnFilter.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired
};

export default ColumnFilter;
