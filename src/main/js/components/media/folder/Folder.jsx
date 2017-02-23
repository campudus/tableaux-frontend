const React = require('react');
import connectToAmpersand from "../../HOCs/connectToAmpersand";
import Dispatcher from "../../../dispatcher/Dispatcher";
import NewFolderAction from "./NewFolderAction.jsx";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";
import {translate} from "react-i18next";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {contains, sortBy, prop, map, compose, reverse} from "lodash/fp";
let Subfolder = require('./Subfolder.jsx');
let File = require('./File.jsx');
let FileUpload = require('./FileUpload.jsx');
const ActionCreator = require('../../../actions/ActionCreator');

@translate(["media"])
@connectToAmpersand
class Folder extends React.Component {

  static propTypes = {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {modifiedFiles: []};
  }

  backFolderHandler = (event) =>{
    event.preventDefault();
    ActionCreator.switchFolder(this.props.folder.parent, this.props.langtag);
  };

  componentWillMount() {
    Dispatcher.on(ActionTypes.ADD_FILE, this.setModifiedFlag);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.ADD_FILE, this.setModifiedFlag);
  }

  setModifiedFlag = ({uuid}) => {
    console.log("setting modified:", uuid)
    const {modifiedFiles} = this.state;
    this.setState({modifiedFiles: [...modifiedFiles, uuid]}, this.forceUpdate);
  };

  renderCurrentFolder = () => {
    let currentFolder = '';
    const currentFolderClass = ['current-folder'];
    if (this.props.folder.name === "root") {
      currentFolder = this.props.t('root_folder_name');
    } else if (this.props.folder.name && this.props.folder.description) {
      currentFolder = this.props.folder.name + " – " + this.props.folder.description;
    } else if (this.props.folder.name) {
      currentFolder = this.props.folder.name;
    } else {
      currentFolder = "Folder " + this.props.folder.id;
    }

    if (this.props.folder.name !== "root") {
      currentFolder = <a href="#" onClick={this.backFolderHandler}>
        <span className="back"><i className="fa fa-chevron-left"/>{currentFolder}</span>
      </a>;
    } else {
      currentFolderClass.push("is-root");
    }

    return (
      <div className={currentFolderClass.join(" ")}>
        {currentFolder}
      </div>
    );
  };

  renderSubfolders  = () =>{
    const subFolders = this.props.folder.subfolders;
    const {langtag} = this.props;
    if (subFolders && subFolders.length > 0) {
      const subfolder = subFolders.map((folder, idx) => {
        return <li key={idx}><Subfolder key={idx} folder={folder} langtag={langtag} /></li>
      });
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {subfolder}
          </ol>
        </div>
      );
    } else {
      return null;
    }
  };

  renderFiles  = () => {
    const files = this.props.folder.files;
    const {langtag} = this.props;
    const {modifiedFiles} = this.state;

    const sortAndMarkup = compose(
      map((file) => {
        return (
          <li key={file.uuid}
              className={(contains(file.uuid, modifiedFiles)) ? "modified-file" : ""}>
            <File key={file.uuid} file={file}
                  langtag={langtag}/>
          </li>
        );
      }),
      reverse, // keep latest first
      sortBy(prop("updatedAt"))
    );

    if (files && files.length > 0) {
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {sortAndMarkup(files.models)}
          </ol>
        </div>
      );
    } else {
      return null;
    }
  };

  render() {
    const newFolderAction = isUserAdmin() ? <NewFolderAction parentFolder={this.props.folder}/> : null;
    return (
      <div id="media-wrapper">
        {this.renderCurrentFolder()}
        {newFolderAction}
        {this.renderSubfolders()}
        {this.renderFiles()}
        <FileUpload folder={this.props.folder}/>
      </div>
    );
  }

}

export default Folder;