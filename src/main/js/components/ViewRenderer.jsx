import React from "react";
import TableauxConstants from "../constants/TableauxConstants";
import TableView from "../components/TableView.jsx";
import MediaView from "../components/media/MediaView.jsx";

const ViewNames = TableauxConstants.ViewNames;

export default class ViewRenderer extends React.Component {

  static propTypes = {
    viewName: React.PropTypes.string.isRequired,
    params: React.PropTypes.object.isRequired
  };

  shouldComponentUpdate(nextProps) {
    return nextProps.viewName !== this.props.viewName || nextProps.params !== this.props.params;
  }

  constructor(props) {
    super(props);

    this.views = {};
    this.views[ViewNames.TABLE_VIEW] = () => {
      return (
        <TableView {...this.props.params}
          overlayOpen={!!this.props.params.overlayOpen}
        />
      );
    };

    this.views[ViewNames.MEDIA_VIEW] = () => {
      return <MediaView langtag={this.props.params.langtag}
                        folderId={this.props.params.folderId}
                        overlayOpen={!!this.props.params.overlayOpen} />;
    };
  }

  getView(viewName) {
    if (this.views[viewName]) {
      return this.views[viewName]();
    } else {
      // TODO show error to user
      console.error("View with name " + viewName + " not found.");
    }
  }

  render() {
    return this.getView(this.props.viewName);
  }

}
