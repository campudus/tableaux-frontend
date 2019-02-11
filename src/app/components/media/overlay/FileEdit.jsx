import {
  branch,
  compose,
  lifecycle,
  renderComponent,
  withStateHandlers
} from "recompose";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import f from "lodash/fp";

import { reduceMediaValuesToAllowedLanguages } from "../../../helpers/accessManagementHelper";
import MultiFileEdit from "./MultiFileEdit";
import SingleFileEdit from "./SingleFileEdit";

const mapStateToProps = (state, props) => {
  const file = f.head(
    f.filter(file => file.uuid === props.fileId)(
      f.get(["media", "data", "files"], state)
    )
  );

  return { file: file };
};

const enhance = compose(
  withStateHandlers(
    ({ file, langtag }) => ({
      langtag,
      fileAttributes: {
        title: file.title,
        description: file.description,
        externalName: file.externalName
      }
    }),
    {
      setFileAttribute: ({ fileAttributes }) => (name, langtag, value) => ({
        fileAttributes: f.assoc([name, langtag], value, fileAttributes)
      }),
      resetFileAttributes: () => fileInfo => ({
        fileAttributes: f.pick(
          ["description", "title", "externalName"],
          fileInfo
        )
      }),
      onLangChange: () => langtag => ({ langtag })
    }
  ),
  lifecycle({
    componentDidUpdate(prevProps) {
      // reset state with props to show new file with its attributes
      const oldFileCount = f.size(prevProps.file.internalName);
      const newFileCount = f.size(this.props.file.internalName);
      const file = this.props.file;

      if (oldFileCount < newFileCount) {
        this.props.resetFileAttributes(file);
      }
    },
    componentWillUnmount() {
      const { file, fileAttributes, onClose } = this.props;
      if (
        !f.equals(
          fileAttributes,
          f.pick(["title", "description", "externalName"], file)
        )
      ) {
        const { title, description, externalName } = fileAttributes;
        const changeFileParams = reduceMediaValuesToAllowedLanguages([
          file.uuid,
          title,
          description,
          externalName,
          file.internalName,
          file.mimeType,
          file.folder,
          file.fileUrl
        ]);

        onClose(changeFileParams);
      } else {
        onClose();
      }
    }
  })
);

const FileEdit = compose(
  branch(
    props =>
      f.flow(
        f.get("internalName"),
        f.keys,
        f.size,
        f.gt(f, 1)
      )(props.file),
    renderComponent(MultiFileEdit)
  )
)(SingleFileEdit);

FileEdit.propTypes = {
  fileId: PropTypes.string.isRequired,
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired
};

export default connect(mapStateToProps)(compose(enhance)(FileEdit));
