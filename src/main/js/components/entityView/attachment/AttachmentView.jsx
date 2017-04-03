import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import LinkList from "../../helperComponents/LinkList";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import multiLanguage from "../../../helpers/multiLanguage";

class AttachmentView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "AttachmentView";
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    tabIdx: PropTypes.number
  };

  removeAttachment = uuid => () => {
    const {cell} = this.props;
    const newValue = cell.value.filter(el => el.uuid !== uuid);
    ActionCreator.changeCell(cell, newValue);
  };

  render() {
    const {cell, langtag} = this.props;

    /*const attachments = cell.value.map((element, id) => {
      return <AttachmentLabelCell key={id} attachmentElement={element} cell={cell}
                                  langtag={langtag}
                                  deletable={true}
                                  onDelete={this.removeAttachment(element.uuid)}
      />;
    });*/

    const attachments = cell.value.map(
      ({title}, idx) => {
        const translate = multiLanguage.retrieveTranslation(FallbackLanguage);
        const displayName = translate(title, langtag);
        return {displayName}
      }
    );

    return (
      <div className="view-content link">
        <LinkList links={attachments} />
      </div>
    );
  }
}

export default AttachmentView;
