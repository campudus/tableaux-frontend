var AmpersandModel = require("ampersand-model");
var apiUrl = require("../../helpers/apiUrl");
import {currentLangtag} from "../../router";

var SimpleFolder = AmpersandModel.extend({
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
    var base = this.urlRoot();

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
