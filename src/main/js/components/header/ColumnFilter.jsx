import React from "react";
import * as _ from "lodash/fp";
import ColumnFilterPopup from "./ColumnFilterPopup";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class ColumnFilter extends React.Component {

  state = {open: false};

  togglePopup = () => {
    this.setState({open: !this.state.open});
  };

  handleClickOutside = () => {
    this.setState({open: false});
  }

  render = () => {
    const {langtag, colVisible} = this.props;
    const {open} = this.state;
    const n_hidden = _.filter(x => !x, colVisible).length;
    console.log("--- ColumnFilter COLUMNS ---", this.props.columns)
    const css_class = _.compose(
      _.nth(1),                                                         // choose the string
      _.find(_.first)                                                   // check the bool, return first true
    )(_.zip([open, n_hidden > 0, true], ["active", "has-filter", ""])); // [[bool, str], ...]
    return (
      <div id="column-filter-wrapper" className={css_class}>
        <a href="#" className="button" onMouseDown={this.togglePopup}>
          <text className="infotext">
            {(n_hidden > 0)
              ? n_hidden
              : null
            }
          </text>
          <i className="fa fa-eye" />
        </a>
        {(open)
          ? <ColumnFilterPopup langtag={langtag}
                               colVisible={colVisible}
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
  colVisible: React.PropTypes.array.isRequired,
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired
};

export default ColumnFilter;