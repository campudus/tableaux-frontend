import AmpersandModel from "ampersand-model";
import apiUrl from "../../helpers/apiUrl";
import FoldersCollection from "./FoldersCollection";
import FilesCollection from "./FilesCollection";

const Folder = AmpersandModel.extend({
  props: {
    id: {
      type: "number",
      default: null
    },
    name: "string",
    description: "string",
    parent: "number"
  },

  collections: {
    subfolders: FoldersCollection,
    files: FilesCollection
  },

  initialize: function () {
    this.get("subfolders").on("add remove change", function () {
      this.trigger("change");
    }, this);

    this.get("files").on("add remove change", function () {
      this.trigger("change");
    }, this);
  },

  url: function () {
    const base = this.urlRoot();

    if (this.isNew() || isNaN(this.getId())) {
      return base;
    } else {
      return base + "/" + this.getId();
    }
  },

  urlRoot: function () {
    return apiUrl("/folders");
  }
});

export default Folder;
