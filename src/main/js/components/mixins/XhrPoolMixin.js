'use strict';

//TODO: Change to HOC
var XhrPoolMixin = {
  addAbortableXhrRequest : function (xhr) {
    if (xhr instanceof window.XMLHttpRequest) {
      this.xhrObjects = this.xhrObjects || [];
      this.xhrObjects.push(xhr);
      var self = this;
      xhr.addEventListener("load", function () {
        var index = self.xhrObjects.indexOf(xhr);
        if (index > -1) {
          self.xhrObjects.splice(index, 1);
        }
      }, false);
    } else {
      throw "Parameter is not a XMLHttpRequest object.";
    }
  },

  componentWillUnmount : function () {
    if (this.xhrObjects) {
      this.xhrObjects.forEach(function (xhr) {
        xhr.abort();
      });
    }
  }

};


module.exports = XhrPoolMixin;