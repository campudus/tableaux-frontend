import PropTypes from "prop-types";
import f from "lodash/fp";
import {branch, compose, lifecycle, renderComponent, withHandlers, withStateHandlers} from "recompose";
import MultiFileEdit from "./MultiFileEdit";
import SingleFileEdit from "./SingleFileEdit";
import {reduceMediaValuesToAllowedLanguages} from "../../../helpers/accessManagementHelper";
import {ActionTypes} from "../../../constants/TableauxConstants";

const enhance = compose(
  withStateHandlers(
    ({file, langtag}) => ({
      langtag,
      fileAttributes: {
        title: file.title,
        description: file.description,
        externalName: file.externalName
      }
    }),
    {
      setFileAttribute: ({fileAttributes}) => (name, langtag, value) => ({
        fileAttributes: f.assoc([name, langtag], value, fileAttributes)
      }),
      resetFileAttributes: () => (fileInfo) => ({
        fileAttributes: f.pick(["description", "title", "externalName"], fileInfo)
      }),
      onLangChange: () => (langtag) => ({langtag})
    }
  ),
  withHandlers({
    onSave: ({file, onClose, fileAttributes}) => (event) => {
      if (!f.equals(
          fileAttributes,
          f.pick(["title", "description", "externalName"], file))
      ) {
        const {title, description, externalName} = fileAttributes;
        const changeFileParams = reduceMediaValuesToAllowedLanguages([file.uuid, title, description, externalName, file.internalName, file.mimeType, file.folder, file.fileUrl]);
        // ActionCreator.changeFile(...changeFileParams);
      }
      onClose(event);
    }
  }),

  lifecycle({
    componentWillMount() {
      //Dispatcher.on("on-media-overlay-save", this.props.onSave);
      //Dispatcher.on(ActionTypes.CHANGED_FILE_DATA, this.props.resetFileAttributes);
    },
    componentWillUnmount() {
      //Dispatcher.off("on-media-overlay-save", this.props.onSave);
      //Dispatcher.on(ActionTypes.CHANGED_FILE_DATA, this.props.resetFileAttributes);
    }
  })
);

const FileEdit = compose(
  branch(
    (props) => f.flow(
      f.get("internalName"),
      f.keys,
      f.size,
      f.gt(f, 1)
    )(props.file),
    renderComponent(MultiFileEdit)
  )
)(SingleFileEdit);

FileEdit.propTypes = {
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default compose(
  enhance
)(FileEdit);
