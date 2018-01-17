import apiUrl from "../../helpers/apiUrl";
import AmpersandModel from "ampersand-model";
import {currentLangtag} from "../../router/router";

const SimpleFolder = AmpersandModel.extend({
  props: {
    id: "number",
    name: "string",
    description: "string",
    parent: {
      type: "number",
      default: null,
      allowNull: true
    }
  },

  url: function () {
    const base = this.urlRoot();

    if (this.isNew() || isNaN(this.getId())) {
      return base;
    } else {
      return base + "/" + this.getId() + "?langtag=" + currentLangtag;
    }
  },

  urlRoot: function () {
    return apiUrl("/folders");
  }
});

module.exports = SimpleFolder;
