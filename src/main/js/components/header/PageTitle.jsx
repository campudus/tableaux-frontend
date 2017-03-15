import React from "react";
import {translate} from "react-i18next";

@translate(["header"])
export default class PageTitle extends React.Component {

  static propTypes = {
    titleKey: React.PropTypes.string.isRequired
  };

  render() {
    let {t} = this.props;
    return (
      <div id="header-pagename">{t(this.props.titleKey)}</div>
    );
  }
}
