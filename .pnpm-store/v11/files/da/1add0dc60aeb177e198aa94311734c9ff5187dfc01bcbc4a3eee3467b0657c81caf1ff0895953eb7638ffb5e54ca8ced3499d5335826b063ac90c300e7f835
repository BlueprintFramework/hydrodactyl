"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFrame = getFrame;
exports.getMountElement = getMountElement;
function getFrame(element) {
  var doc = element && element.ownerDocument || document;
  var win = doc.defaultView || doc.parentWindow || window;
  return {
    document: doc,
    window: win
  };
}
function getMountElement(element) {
  return element || document.head;
}