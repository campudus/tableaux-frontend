import React, {Component, PropTypes} from "react";
import {translate} from "react-i18next";
import classNames from "classnames";
import {changeCell} from "../../../models/Tables";
import SvgIcon from "../../helperComponents/SvgIcon";
import {contentChanged} from "../../cells/Cell";

@translate(["common"])
class BooleanView extends Component {

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const {langtag, cell: {value, isMultiLanguage}} = props;
    this.state = {selected: (isMultiLanguage) ? value[langtag] : value};
  }

  toggleValue = event => {
    event.preventDefault();
    event.stopPropagation();
    const {cell, langtag, thisUserCantEdit} = this.props;
    if (thisUserCantEdit) {
      return;
    }

    const newValue = !this.state.selected;
    const changes = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    this.setState({selected: newValue});
    changeCell({cell, value: changes})
      .then(() => contentChanged(cell, langtag));
  };

  toggleOnEnter = event => {
    if (event.key === "Enter") {
      this.toggleValue(event);
    }
  };

  render() {
    const {t, funcs, thisUserCantEdit} = this.props;
    const {selected} = this.state;
    const checkboxCss = classNames("checkbox", {"checked": selected, "disabled": thisUserCantEdit});

    return (
        <div className="item-content boolean" onClick={this.toggleValue}
             onKeyDown={this.toggleOnEnter}
             tabIndex={1}
             ref={el => { funcs.register(el); }}
        >
          <div className={checkboxCss}>
            {(selected)
              ? <SvgIcon icon="check"/>
              : ""
            }
          </div>
          <div className="value">{`${t("current_selection")}: `}<div>{selected ? t("yes") : t("no")}</div></div>
          {this.props.children}
        </div>
    );
  }
}

export default BooleanView;
