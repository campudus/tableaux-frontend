import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import SvgIcon from "./helperComponents/SvgIcon";
import i18n from "i18next";
import listenToClickOutside from "react-onclickoutside";
import classNames from "classnames";

class MultiselectArea extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired, // items to display
    tagRenderer: PropTypes.func, // receives one item to render a selected tag, default: use label property
    listItemRenderer: PropTypes.func, // receives one item to render an entry in the select-dropdown, default: use label property
    placeholder: PropTypes.any, // if nothing selected
    allSelected: PropTypes.any, // if dropdown list is empty
    selection: PropTypes.array, // array of selected items
    onChange: PropTypes.func, // receives single item to toggle
    idProperty: PropTypes.string, // default: "id", for comparisons and keys
    labelProperty: PropTypes.string, // default: "label", define text fallback
    deleteTagIcon: PropTypes.element, // instead of svg-cross
    keepSelectedInList: PropTypes.bool, // don't remove selected items from dropdown
    order: PropTypes.func // gets passed an item, returns a value to compare
  };

  constructor(props) {
    super(props);
    this.state = {
      selection: props.selection || [],
      listOpen: false
    };
  }

  getIdProperty = () => this.props.idProperty || "id";
  getLabelProperty = () => this.props.labelProperty || "label";
  getDeleteTagIcon = () => this.props.deleteTagIcon || <SvgIcon icon="cross" />;
  getPlaceholder = () => {
    const placeHolder =
      this.props.placeholder || "common:multiselect.no-selection";
    return f.isString(placeHolder) ? (
      <span>{i18n.t(placeHolder)}</span>
    ) : (
      placeHolder
    );
  };
  getEmptyListPlaceholder = () => {
    const placeholder =
      this.props.allSelected || "common:multiselect.all-selected";
    return (
      <div className="multiselect-list-item empty-list">
        {f.isString(placeholder) ? i18n.t(placeholder) : placeholder}
      </div>
    );
  };
  getOrderFn = () => this.props.order || this.getId;

  getId = item => f.get(this.getIdProperty(), item) || item;
  getLabel = item => f.get(this.getLabelProperty(), item) || this.getId(item);

  openList = status => () => {
    if (this.state.listOpen !== status) {
      this.setState({ listOpen: status });
    }
  };

  handleClickOutside = () => {
    this.openList(false)();
  };

  handleSelect = item => event => {
    event.stopPropagation();
    this.toggleItem(item);
  };

  handleDeselect = item => event => {
    event.stopPropagation();
    this.toggleItem(item);
  };

  toggleItem = item => {
    this.props.onChange && this.props.onChange(item);
  };

  renderTag = item => {
    const { tagRenderer } = this.props;
    const tagElement = tagRenderer ? tagRenderer(item) : this.getLabel(item);
    const iconElement = this.getDeleteTagIcon();

    return (
      <div
        key={this.getId(item)}
        className="multiselect-tag"
        onClick={this.handleDeselect(item)}
      >
        {tagElement}
        <div className="multiselect-tag-deselect-icon">{iconElement}</div>
      </div>
    );
  };

  renderListItem = item => {
    const { listItemRenderer } = this.props;
    const listItem = listItemRenderer
      ? listItemRenderer(item)
      : this.getLabel(item);
    return (
      <li
        className="multiselect-list-item"
        key={this.getId(item)}
        onClick={this.handleSelect(item)}
      >
        {listItem}
      </li>
    );
  };

  componentWillReceiveProps = next => {
    if (
      !f.every(f.isNil, [next.selection, this.props.selection]) &&
      !f.equals(next.selection, this.props.selection)
    ) {
      this.setState({ selection: next.selection });
    }
  };

  renderList = () => {
    const { options, keepSelectedInList } = this.props;
    const { selection } = this.state;
    const selectedIds = f.map(this.getId, selection);
    const listItems = keepSelectedInList
      ? options
      : f.reject(item => f.contains(this.getId(item), selectedIds), options);
    return (
      <ul className="multiselect-item-list">
        {f.isEmpty(listItems)
          ? this.getEmptyListPlaceholder()
          : f.sortBy(this.getOrderFn(), listItems).map(this.renderListItem)}
      </ul>
    );
  };

  render() {
    const { listOpen } = this.state;
    const { selection } = this.props;
    const areaClass = classNames("multiselect-area", {
      "ignore-react-onclickoutside": listOpen,
      "no-selection": f.isEmpty(selection)
    });

    return (
      <div className={areaClass} onClick={this.openList(!listOpen)}>
        {f.isEmpty(selection)
          ? this.getPlaceholder()
          : f.sortBy(this.getOrderFn(), selection).map(this.renderTag)}
        <div className={`multiselect-list-wrapper ${listOpen ? "open" : ""}`}>
          {listOpen ? this.renderList() : null}
        </div>
        <div className="multiselect-drop-icon">
          <i className={`fa fa-${listOpen ? "angle-up" : "angle-down"}`} />
        </div>
      </div>
    );
  }
}

export default listenToClickOutside(MultiselectArea);
