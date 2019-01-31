import {
  branch,
  compose,
  lifecycle,
  renderComponent,
  withStateHandlers
} from "recompose";

import PropTypes from "prop-types";
import f from "lodash/fp";

import { reduceMediaValuesToAllowedLanguages } from "../../../helpers/accessManagementHelper";
import MultiFileEdit from "./MultiFileEdit";
import SingleFileEdit from "./SingleFileEdit";

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
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired
};

export default compose(enhance)(FileEdit);
