import React from "react";
import ColumnFilterPopup from "./ColumnFilterPopup";
import listensToClickOutside from "react-onclickoutside";
import i18n from "i18next";
import classNames from "classnames";

@listensToClickOutside
class ColumnFilter extends React.Component {

  state = {open: false};

  togglePopup = event => {
    event.preventDefault();
    this.setState({open: !this.state.open});
  };

  handleClickOutside = () => {
    this.setState({open: false});
  };

  render = () => {
    const {langtag, columns} = this.props;
    const {open} = this.state;
    const nHidden = columns.filter(x => !x.visible).length;
    const message = nHidden + " " + i18n.t("table:hidden_items");
    const cssClass = classNames({
      "active": open,
      "has-filter": !open && nHidden > 0,
    });
    return (
      <div id="column-filter-wrapper" className={cssClass}>
        <a href="#" className="button" onMouseDown={this.togglePopup}>
          <i className="fa fa-eye" />
          {(nHidden > 0)
            ? <text className="infotext">{message}</text>
            : null
          }
        </a>
        {(open)
          ? <ColumnFilterPopup langtag={langtag}
                               close={this.togglePopup}
                               columns={this.props.columns}
          />
          : null
        }
      </div>
    )
  }
};

ColumnFilter.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired,
};

export default ColumnFilter;