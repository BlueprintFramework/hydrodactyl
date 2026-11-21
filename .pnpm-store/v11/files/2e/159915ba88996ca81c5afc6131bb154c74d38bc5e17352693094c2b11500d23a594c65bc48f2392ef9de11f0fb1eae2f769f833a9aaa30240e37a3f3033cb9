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
export { getFrame, getMountElement };