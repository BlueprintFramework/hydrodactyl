'use client';
'use strict';

const Object$ = Object;
const Map$ = Map;
const Set$ = Set;
const SetHas$ = Set$.prototype.has;
const SetAdd$ = Set$.prototype.add;
const MapHas$ = Map$.prototype.has;
const MapGet$ = Map$.prototype.get;
const MapSet$ = Map$.prototype.set;
const ChildFlag = 1;
const AttributeFlag = 2;
const EventFlag = 4;
const StyleAttributeFlag = 8;
const SvgAttributeFlag = 16;
const BlockFlag = 32;
const TEXT_NODE_CACHE = "__t";
const EVENT_PATCH = "__p";
const EVENTS_REGISTRY = "__e";
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
const XLINK_NS = "http://www.w3.org/1999/xlink";
const XML_NS = "http://www.w3.org/2000/xmlns/";
const X_CHAR = 120;
const NON_PROPS = new Set$(["href", "list", "form", "tabIndex", "download"]);
const VOID_ELEMENTS = new Set$(["area", "base", "basefont", "bgsound", "br", "col", "command", "embed", "frame", "hr", "image", "img", "input", "isindex", "keygen", "link", "menuitem", "meta", "nextid", "param", "source", "track", "wbr"]);

if (typeof window === "undefined") {
  throw new Error(
    "See http://million.dev/docs/install to install the compiler."
  );
}
const document$ = document;
document$.createElement("template");
const HTM_TEMPLATE = /* @__PURE__ */ document$.createElement("template");
const HTM_TEMPLATE_CONTENT = HTM_TEMPLATE.content;
const SVG_TEMPLATE = /* @__PURE__ */ document$.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
);
const node$ = Node.prototype;
const element$ = Element.prototype;
const characterData$ = CharacterData.prototype;
const getOwnPropertyDescriptor$ = Object$.getOwnPropertyDescriptor;
const insertBefore$ = node$.insertBefore;
const cloneNode$ = node$.cloneNode;
const replaceChild$ = node$.replaceChild;
const remove$$1 = element$.remove;
const addEventListener$ = node$.addEventListener;
const removeAttribute$ = element$.removeAttribute;
const setAttribute$ = element$.setAttribute;
const setAttributeNS$ = element$.setAttributeNS;
const setTextContent$ = getOwnPropertyDescriptor$(node$, "textContent").set;
const firstChild$ = getOwnPropertyDescriptor$(node$, "firstChild").get;
const nextSibling$ = getOwnPropertyDescriptor$(node$, "nextSibling").get;
const characterDataSet$ = getOwnPropertyDescriptor$(
  characterData$,
  "data"
).set;
const stringToDOM = (content, svg) => {
  const template = svg ? SVG_TEMPLATE : HTM_TEMPLATE;
  template.innerHTML = content;
  const dom = svg ? SVG_TEMPLATE : HTM_TEMPLATE_CONTENT;
  return dom.firstChild;
};
document$[EVENTS_REGISTRY] = new Set$();
const createEventListener = (el, name, value) => {
  let event = name.toLowerCase();
  let capture = false;
  if (event.endsWith("capture")) {
    event = event.slice(0, -7);
    capture = true;
  }
  const key = `$$${event}`;
  if (!SetHas$.call(document$[EVENTS_REGISTRY], event)) {
    addEventListener$.call(
      document$,
      event,
      (nativeEvent) => {
        let el2 = nativeEvent.target;
        while (el2) {
          const handler = el2[key];
          if (handler) {
            Object$.defineProperty(nativeEvent, "currentTarget", {
              configurable: true,
              get() {
                return el2;
              }
            });
            handler(nativeEvent);
          }
          el2 = el2.parentNode;
        }
      },
      { capture }
    );
    SetAdd$.call(document$[EVENTS_REGISTRY], event);
  }
  const patch = (newValue) => {
    if (!newValue) {
      el[key] = null;
    } else if (!("key" in newValue && newValue.key === el[key]?.key)) {
      el[key] = newValue;
    }
  };
  patch(value);
  return patch;
};
const childAt = (el, index) => {
  let child = firstChild$.call(el);
  if (index) {
    for (let j = 0; j < index; ++j) {
      if (!child)
        break;
      child = nextSibling$.call(child);
    }
  }
  return child;
};
const visitedNodes = /* @__PURE__ */ new WeakSet();
const removeComments = (el) => {
  if (visitedNodes.has(el)) {
    return;
  }
  if (el.nodeType === 8) {
    el.parentNode?.removeChild(el);
  }
  let child = firstChild$.call(el);
  while (child) {
    removeComments(child);
    child = child.nextSibling;
  }
  visitedNodes.add(el);
};
const insertText = (el, value, index) => {
  const node = document$.createTextNode(value);
  const child = childAt(el, index);
  insertBefore$.call(el, node, child);
  return node;
};
const setText = (el, value) => {
  characterDataSet$.call(el, value);
};
const setStyleAttribute = (el, name, value) => {
  if (typeof value !== "number" || IS_NON_DIMENSIONAL.test(name)) {
    el.style[name] = value;
  } else if (typeof value === "string") {
    el.style.cssText = value;
  } else if (name.startsWith("-")) {
    el.style.setProperty(name, String(value));
  } else if (value === void 0 || value === null) {
    el.style[name] = "";
  } else {
    el.style[name] = `${String(value)}px`;
  }
};
const setSvgAttribute = (el, name, value) => {
  name = name.replace(/xlink(?:H|:h)/, "h").replace(/sName$/, "s");
  if (name.startsWith("xmlns")) {
    setAttributeNS$.call(el, XML_NS, name, String(value));
  } else if (name.startsWith("xlink")) {
    setAttributeNS$.call(el, XLINK_NS, "href", String(value));
  }
};
const setAttribute = (el, name, value) => {
  const isValueNully = value === void 0 || value === null;
  value = isValueNully ? "" : value;
  if (name in el && el[name] !== void 0 && el[name] !== null && !(el instanceof SVGElement) && SetHas$.call(NON_PROPS, name)) {
    try {
      el[name] = value;
    } catch (_err) {
    }
  } else if (!isValueNully && value !== "" && (value !== false || name.includes("-"))) {
    setAttribute$.call(el, name, String(value));
  } else {
    removeAttribute$.call(el, name);
  }
  const isInput = el instanceof HTMLInputElement;
  const isSelect = el instanceof HTMLSelectElement;
  const isTextArea = el instanceof HTMLTextAreaElement;
  if (name === "value" && (isInput || isSelect || isTextArea)) {
    setAttribute$.call(el, name, String(value));
    el.value = value;
  }
};

const aliases = /* @__PURE__ */ new Map([
  ["acceptCharset", "accept-charset"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"],
  // HTML and SVG attributes, but the SVG attribute is case sensitive.],
  ["crossOrigin", "crossorigin"],
  // This is a list of all SVG attributes that need special casing.
  // Regular attributes that just accept strings.],
  ["accentHeight", "accent-height"],
  ["alignmentBaseline", "alignment-baseline"],
  ["arabicForm", "arabic-form"],
  ["baselineShift", "baseline-shift"],
  ["capHeight", "cap-height"],
  ["clipPath", "clip-path"],
  ["clipRule", "clip-rule"],
  ["colorInterpolation", "color-interpolation"],
  ["colorInterpolationFilters", "color-interpolation-filters"],
  ["colorProfile", "color-profile"],
  ["colorRendering", "color-rendering"],
  ["dominantBaseline", "dominant-baseline"],
  ["enableBackground", "enable-background"],
  ["fillOpacity", "fill-opacity"],
  ["fillRule", "fill-rule"],
  ["floodColor", "flood-color"],
  ["floodOpacity", "flood-opacity"],
  ["fontFamily", "font-family"],
  ["fontSize", "font-size"],
  ["fontSizeAdjust", "font-size-adjust"],
  ["fontStretch", "font-stretch"],
  ["fontStyle", "font-style"],
  ["fontVariant", "font-variant"],
  ["fontWeight", "font-weight"],
  ["glyphName", "glyph-name"],
  ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
  ["glyphOrientationVertical", "glyph-orientation-vertical"],
  ["horizAdvX", "horiz-adv-x"],
  ["horizOriginX", "horiz-origin-x"],
  ["imageRendering", "image-rendering"],
  ["letterSpacing", "letter-spacing"],
  ["lightingColor", "lighting-color"],
  ["markerEnd", "marker-end"],
  ["markerMid", "marker-mid"],
  ["markerStart", "marker-start"],
  ["overlinePosition", "overline-position"],
  ["overlineThickness", "overline-thickness"],
  ["paintOrder", "paint-order"],
  ["panose-1", "panose-1"],
  ["pointerEvents", "pointer-events"],
  ["renderingIntent", "rendering-intent"],
  ["shapeRendering", "shape-rendering"],
  ["stopColor", "stop-color"],
  ["stopOpacity", "stop-opacity"],
  ["strikethroughPosition", "strikethrough-position"],
  ["strikethroughThickness", "strikethrough-thickness"],
  ["strokeDasharray", "stroke-dasharray"],
  ["strokeDashoffset", "stroke-dashoffset"],
  ["strokeLinecap", "stroke-linecap"],
  ["strokeLinejoin", "stroke-linejoin"],
  ["strokeMiterlimit", "stroke-miterlimit"],
  ["strokeOpacity", "stroke-opacity"],
  ["strokeWidth", "stroke-width"],
  ["textAnchor", "text-anchor"],
  ["textDecoration", "text-decoration"],
  ["textRendering", "text-rendering"],
  ["transformOrigin", "transform-origin"],
  ["underlinePosition", "underline-position"],
  ["underlineThickness", "underline-thickness"],
  ["unicodeBidi", "unicode-bidi"],
  ["unicodeRange", "unicode-range"],
  ["unitsPerEm", "units-per-em"],
  ["vAlphabetic", "v-alphabetic"],
  ["vHanging", "v-hanging"],
  ["vIdeographic", "v-ideographic"],
  ["vMathematical", "v-mathematical"],
  ["vectorEffect", "vector-effect"],
  ["vertAdvY", "vert-adv-y"],
  ["vertOriginX", "vert-origin-x"],
  ["vertOriginY", "vert-origin-y"],
  ["wordSpacing", "word-spacing"],
  ["writingMode", "writing-mode"],
  ["xmlnsXlink", "xmlns:xlink"],
  ["xHeight", "x-height"]
]);
function getAttributeAlias(name) {
  return aliases.get(name) || name;
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class AbstractBlock {
  constructor() {
    /* root */
    __publicField$1(this, "r");
    /* edits */
    __publicField$1(this, "e");
    /* el */
    __publicField$1(this, "l");
    /* getElements */
    __publicField$1(this, "g");
    /* _shouldUpdate */
    __publicField$1(this, "_u");
    /* _parent */
    __publicField$1(this, "_t");
    /* props */
    __publicField$1(this, "d");
    /* key */
    __publicField$1(this, "k");
    /* cache */
    __publicField$1(this, "c");
  }
}

const renderToTemplate = (vnode, edits = [], path = []) => {
  if (typeof vnode === "string")
    return vnode;
  if (typeof vnode === "number" || typeof vnode === "bigint" || vnode === true) {
    return String(vnode);
  }
  if (vnode === null || vnode === void 0 || vnode === false)
    return "";
  if (typeof vnode === "object" && "$" in vnode) {
    edits.push({
      p: path,
      e: [
        {
          /* type */
          t: ChildFlag,
          /* name */
          n: null,
          /* value */
          v: null,
          /* hole */
          h: vnode.$,
          /* index */
          i: 0,
          /* listener */
          l: null,
          /* patch */
          p: null,
          /* block */
          b: null
        }
      ],
      i: []
    });
    return "<slot/>";
  }
  let props = "";
  let children = "";
  const current = {
    p: path,
    // The location of the edit in in the virtual node tree
    e: [],
    // Occur on mount + patch
    i: []
    // Occur before mount
  };
  for (let name in vnode.props) {
    const value = vnode.props[name];
    if (name === "key" || name === "ref" || name === "children") {
      continue;
    }
    const alias = getAttributeAlias(name);
    if (alias)
      name = alias;
    if (name === "className")
      name = "class";
    if (name.startsWith("on")) {
      const isValueHole = "$" in value;
      if (isValueHole) {
        current.e.push({
          /* type */
          t: EventFlag,
          /* name */
          n: name.slice(2),
          /* value */
          v: null,
          /* hole */
          h: value.$,
          /* index */
          i: null,
          /* listener */
          l: null,
          /* patch */
          p: null,
          /* block */
          b: null
        });
      } else {
        current.i.push({
          /* type */
          t: EventFlag,
          /* name */
          n: name.slice(2),
          /* value */
          v: null,
          /* hole */
          h: null,
          /* index */
          i: null,
          /* listener */
          l: value,
          /* patch */
          p: null,
          /* block */
          b: null
        });
      }
      continue;
    }
    if (value) {
      if (typeof value === "object" && "$" in value) {
        if (name === "style") {
          current.e.push({
            /* type */
            t: StyleAttributeFlag,
            /* name */
            n: name,
            /* value */
            v: null,
            /* hole */
            h: value.$,
            /* index */
            i: null,
            /* listener */
            l: null,
            /* patch */
            p: null,
            /* block */
            b: null
          });
        } else if (name.charCodeAt(0) === X_CHAR) {
          current.e.push({
            /* type */
            t: SvgAttributeFlag,
            /* name */
            n: name,
            /* value */
            v: null,
            /* hole */
            h: value.$,
            /* index */
            i: null,
            /* listener */
            l: null,
            /* patch */
            p: null,
            /* block */
            b: null
          });
        } else {
          current.e.push({
            /* type */
            t: AttributeFlag,
            /* name */
            n: name,
            /* value */
            v: null,
            /* hole */
            h: value.$,
            /* index */
            i: null,
            /* listener */
            l: null,
            /* patch */
            p: null,
            /* block */
            b: null
          });
        }
        continue;
      }
      if (name === "style" && typeof value === "object") {
        let style = "";
        for (const key in value) {
          if (typeof value[key] === "object") {
            current.e.push({
              /* type */
              t: StyleAttributeFlag,
              /* name */
              n: key,
              /* value */
              v: null,
              /* hole */
              h: value[key].$,
              /* index */
              i: null,
              /* listener */
              l: null,
              /* patch */
              p: null,
              /* block */
              b: null
            });
            continue;
          }
          let kebabKey = "";
          for (let i = 0, j = key.length; i < j; ++i) {
            const char = key.charCodeAt(i);
            if (char < 97) {
              kebabKey += `-${String.fromCharCode(char + 32)}`;
            } else {
              kebabKey += key[i];
            }
          }
          style += `${kebabKey}:${String(value[key])};`;
        }
        props += ` style="${style}"`;
        continue;
      }
      props += ` ${name}="${String(value)}"`;
    }
  }
  if (SetHas$.call(VOID_ELEMENTS, vnode.type)) {
    if (current.e.length)
      edits.push(current);
    return `<${vnode.type}${props} />`;
  }
  let canMergeString = false;
  for (let i = 0, j = vnode.props.children?.length || 0, k = 0; i < j; ++i) {
    const child = vnode.props.children?.[i];
    if (child === null || child === void 0 || child === false)
      continue;
    if (typeof child === "object" && "$" in child) {
      current.e.push({
        /* type */
        t: ChildFlag,
        /* name */
        n: null,
        /* value */
        v: null,
        /* hole */
        h: child.$,
        /* index */
        i,
        /* listener */
        l: null,
        /* patch */
        p: null,
        /* block */
        b: null
      });
      continue;
    }
    if (child instanceof AbstractBlock) {
      current.i.push({
        /* type */
        t: BlockFlag,
        /* name */
        n: null,
        /* value */
        v: null,
        /* hole */
        h: null,
        /* index */
        i,
        /* listener */
        l: null,
        /* patch */
        p: null,
        /* block */
        b: child
      });
      continue;
    }
    if (typeof child === "string" || typeof child === "number" || typeof child === "bigint") {
      const value = typeof child === "number" || typeof child === "bigint" ? String(child) : child;
      if (canMergeString) {
        current.i.push({
          /* type */
          t: ChildFlag,
          /* name */
          n: null,
          /* value */
          v: value,
          /* hole */
          h: null,
          /* index */
          i,
          /* listener */
          l: null,
          /* patch */
          p: null,
          /* block */
          b: null
        });
        continue;
      }
      canMergeString = true;
      children += value;
      k++;
      continue;
    }
    canMergeString = false;
    const newPath = path.slice();
    newPath.push(k++);
    children += renderToTemplate(child, edits, newPath);
  }
  if (current.i.length || current.e.length)
    edits.push(current);
  return `<${vnode.type}${props}>${children}</${vnode.type}>`;
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const mapArray = (children) => {
  return new ArrayBlock(children);
};
class ArrayBlock extends AbstractBlock {
  constructor(children) {
    super();
    __publicField(this, "b");
    this.b = children;
  }
  v() {
  }
  p(fragment) {
    const oldChildren = this.b;
    const newChildren = fragment.b;
    const oldChildrenLength = oldChildren.length;
    const newChildrenLength = newChildren.length;
    const parent = this.t();
    if (this === fragment)
      return parent;
    if (newChildrenLength === 0 && oldChildrenLength === 0)
      return parent;
    this.b = newChildren;
    if (newChildrenLength === 0) {
      arrayRemove$.call(this);
      return parent;
    }
    if (oldChildrenLength === 0) {
      arrayMount$.call(fragment, parent);
      return parent;
    }
    let oldHead = 0;
    let newHead = 0;
    let oldTail = oldChildrenLength - 1;
    let newTail = newChildrenLength - 1;
    let oldHeadChild = oldChildren[0];
    let newHeadChild = newChildren[0];
    let oldTailChild = oldChildren[oldTail];
    let newTailChild = newChildren[newTail];
    let oldKeyMap;
    while (oldHead <= oldTail && newHead <= newTail) {
      if (!oldHeadChild) {
        oldHeadChild = oldChildren[++oldHead];
        continue;
      }
      if (!oldTailChild) {
        oldTailChild = oldChildren[--oldTail];
        continue;
      }
      const oldHeadKey = oldHeadChild.k;
      const newHeadKey = newHeadChild.k;
      if (oldHeadKey === newHeadKey) {
        patch$.call(oldHeadChild, newHeadChild);
        newChildren[newHead] = oldHeadChild;
        oldHeadChild = oldChildren[++oldHead];
        newHeadChild = newChildren[++newHead];
        continue;
      }
      const oldTailKey = oldTailChild.k;
      const newTailKey = newTailChild.k;
      if (oldTailKey === newTailKey) {
        patch$.call(oldTailChild, newTailChild);
        newChildren[newTail] = oldTailChild;
        oldTailChild = oldChildren[--oldTail];
        newTailChild = newChildren[--newTail];
        continue;
      }
      if (oldHeadKey === newTailKey) {
        patch$.call(oldHeadChild, newTailChild);
        newChildren[newTail] = oldHeadChild;
        const nextChild = newChildren[newTail + 1];
        move$.call(oldHeadChild, nextChild, nextChild?.l || null);
        oldHeadChild = oldChildren[++oldHead];
        newTailChild = newChildren[--newTail];
        continue;
      }
      if (oldTailKey === newHeadKey) {
        patch$.call(oldTailChild, newHeadChild);
        newChildren[newHead] = oldTailChild;
        const nextChild = oldChildren[oldHead];
        move$.call(oldTailChild, nextChild, nextChild?.l || null);
        oldTailChild = oldChildren[--oldTail];
        newHeadChild = newChildren[++newHead];
        continue;
      }
      if (!oldKeyMap) {
        oldKeyMap = new Map$();
        for (let i = oldHead; i <= oldTail; i++) {
          MapSet$.call(oldKeyMap, oldChildren[i].k, i);
        }
      }
      const oldIndex = oldKeyMap.get(newHeadKey);
      if (oldIndex === void 0) {
        mount$.call(newHeadChild, parent, oldHeadChild.l || null);
      } else {
        const oldChild = oldChildren[oldIndex];
        move$.call(oldChild, oldHeadChild, null);
        patch$.call(oldChild, newHeadChild);
        newChildren[newHead] = oldChild;
        oldChildren[oldIndex] = null;
      }
      newHeadChild = newChildren[++newHead];
    }
    if (oldHead <= oldTail || newHead <= newTail) {
      if (oldHead > oldTail) {
        const nextChild = newChildren[newTail + 1];
        for (let i = newHead; i <= newTail; ++i) {
          mount$.call(newChildren[i], parent, nextChild ? nextChild.l : null);
        }
      } else {
        for (let i = oldHead; i <= oldTail; ++i) {
          remove$.call(oldChildren[i]);
        }
      }
    }
    return parent;
  }
  m(parent, refNode = null) {
    if (this._t)
      return this._t;
    for (let i = 0, j = this.b.length; i < j; ++i) {
      const block = this.b[i];
      mount$.call(block, parent, refNode);
    }
    this._t = parent;
    return parent;
  }
  x() {
    const parent = this.t();
    if (parent) {
      setTextContent$.call(parent, "");
    } else {
      for (let i = 0, j = this.b.length; i < j; ++i) {
        remove$.call(this.b[i]);
      }
    }
    this.b = [];
  }
  u() {
    return true;
  }
  s() {
    return this.b.map((block) => block.s()).join("");
  }
  t() {
    if (!this._t)
      this._t = this.b[0].t();
    return this._t;
  }
}
const array$ = ArrayBlock.prototype;
const arrayMount$ = array$.m;
const arrayPatch$ = array$.p;
const arrayRemove$ = array$.x;

const HOLE_PROXY = new Proxy(
  {},
  {
    // A universal getter will return a Hole instance if props[any] is accessed
    // Allows code to identify holes in virtual nodes ("digs" them out)
    get(_, key) {
      return { $: key };
    }
  }
);
const block = (fn, unwrap, shouldUpdate, svg) => {
  const vnode = fn(HOLE_PROXY);
  const edits = [];
  const root = stringToDOM(
    renderToTemplate(unwrap ? unwrap(vnode) : vnode, edits),
    svg
  );
  removeComments(root);
  return (props, key, shouldUpdateCurrentBlock) => {
    return new Block(
      root,
      edits,
      props,
      key ?? props?.key ?? null,
      shouldUpdateCurrentBlock ?? shouldUpdate ?? null,
      null
    );
  };
};
const mount = (block2, parent, hydrateNode) => {
  if ("b" in block2 && parent) {
    return arrayMount$.call(block2, parent, null);
  }
  return mount$.call(block2, parent, null, hydrateNode);
};
const patch = (oldBlock, newBlock) => {
  if ("b" in oldBlock || "b" in newBlock) {
    arrayPatch$.call(oldBlock, newBlock);
  }
  if (!oldBlock.l)
    mount$.call(oldBlock, void 0, null, null);
  if (oldBlock.k && oldBlock.k === newBlock.k || oldBlock.r === newBlock.r) {
    return patch$.call(oldBlock, newBlock);
  }
  const el = mount$.call(newBlock, oldBlock.t(), oldBlock.l, null);
  remove$.call(oldBlock);
  oldBlock.k = newBlock.k;
  return el;
};
class Block extends AbstractBlock {
  constructor(root, edits, props, key, shouldUpdate, getElements) {
    super();
    this.r = root;
    this.d = props;
    this.e = edits;
    this.k = key;
    this.c = Array(edits.length);
    if (shouldUpdate) {
      this._u = shouldUpdate;
    } else {
      this._u = null;
    }
    if (getElements) {
      this.g = getElements;
    } else {
      this.g = null;
    }
  }
  m(parent, refNode = null, hydrateNode) {
    if (this.l)
      return this.l;
    const root = hydrateNode ?? cloneNode$.call(this.r, true);
    const elements = this.g?.(root);
    if (elements)
      this.c = elements;
    for (let i = 0, j = this.e.length; i < j; ++i) {
      const current = this.e[i];
      const el = elements?.[i] ?? getCurrentElement(current.p, root, this.c, i);
      for (let k = 0, l = current.e.length; k < l; ++k) {
        const edit = current.e[k];
        const value = this.d[edit.h];
        if (edit.t & ChildFlag) {
          if (value instanceof AbstractBlock) {
            const child = childAt(el, edit.i);
            if (hydrateNode) {
              value.m(el, child, child);
            } else {
              value.m(el, child);
            }
            continue;
          }
          if (!el[TEXT_NODE_CACHE])
            el[TEXT_NODE_CACHE] = new Array(l);
          if (value && typeof value === "object" && "foreign" in value) {
            if (hydrateNode) {
              const child = childAt(el, edit.i);
              value.reset(child);
            }
            const targetEl = value.current;
            el[TEXT_NODE_CACHE][k] = targetEl;
            if (!hydrateNode) {
              insertBefore$.call(el, targetEl, childAt(el, edit.i));
            }
            continue;
          }
          if (hydrateNode) {
            el[TEXT_NODE_CACHE][k] = childAt(el, edit.i);
            continue;
          }
          el[TEXT_NODE_CACHE][k] = insertText(
            el,
            // eslint-disable-next-line eqeqeq
            value == null || value === false ? "" : String(value),
            edit.i
          );
        } else if (edit.t & EventFlag) {
          const patch2 = createEventListener(el, edit.n, value);
          el[EVENT_PATCH + edit.n] = patch2;
        } else if (edit.t & AttributeFlag) {
          setAttribute(el, edit.n, value);
        } else if (edit.t & StyleAttributeFlag) {
          if (typeof value === "string" || typeof value === "number") {
            setStyleAttribute(el, edit.n, value);
          } else {
            for (const style in value) {
              setStyleAttribute(el, style, value[style]);
            }
          }
        } else {
          setSvgAttribute(el, edit.n, value);
        }
      }
      const initsLength = current.i?.length;
      if (!initsLength)
        continue;
      for (let k = 0; k < initsLength; ++k) {
        const init = current.i[k];
        if (init.t & ChildFlag) {
          if (init.v && !hydrateNode)
            insertText(el, init.v, init.i);
        } else if (init.t & EventFlag) {
          createEventListener(el, init.n, init.l);
        } else {
          const child = childAt(el, init.i);
          if (hydrateNode) {
            init.b.m(el, child, child);
          } else {
            init.b.m(el, child);
          }
        }
      }
    }
    if (parent && !hydrateNode) {
      insertBefore$.call(parent, root, refNode);
    }
    this.l = root;
    return root;
  }
  p(newBlock) {
    const root = this.l;
    if (!newBlock.d)
      return root;
    const props = this.d;
    if (!shouldUpdate$.call(this, props, newBlock.d))
      return root;
    this.d = newBlock.d;
    for (let i = 0, j = this.e.length; i < j; ++i) {
      const current = this.e[i];
      const el = this.c[i] ?? getCurrentElement(current.p, root, this.c, i);
      for (let k = 0, l = current.e.length; k < l; ++k) {
        const edit = current.e[k];
        const oldValue = props[edit.h];
        const newValue = newBlock.d[edit.h];
        if (newValue === oldValue)
          continue;
        if (edit.t & EventFlag) {
          el[EVENT_PATCH + edit.n](newValue);
          continue;
        }
        if (edit.t & ChildFlag) {
          if (oldValue instanceof AbstractBlock) {
            const firstEdit = newBlock.e?.[i]?.e[k];
            const newChildBlock = newBlock.d[firstEdit.h];
            oldValue.p(newChildBlock);
            continue;
          }
          if (newValue && typeof newValue === "object" && "foreign" in newValue) {
            const targetEl = el[TEXT_NODE_CACHE][k];
            if (newValue.unstable && oldValue !== newValue) {
              const newTargetEl = newValue.current;
              el[TEXT_NODE_CACHE][k] = newTargetEl;
              replaceChild$.call(el, newTargetEl, targetEl);
            } else {
              newValue.current = targetEl;
            }
            continue;
          }
          setText(
            el[TEXT_NODE_CACHE][k],
            // eslint-disable-next-line eqeqeq
            newValue == null || newValue === false ? "" : String(newValue)
          );
        } else if (edit.t & AttributeFlag) {
          setAttribute(el, edit.n, newValue);
        } else if (edit.t & StyleAttributeFlag) {
          if (typeof newValue === "string" || typeof newValue === "number") {
            setStyleAttribute(el, edit.n, newValue);
          } else {
            for (const style in newValue) {
              if (newValue[style] !== oldValue[style]) {
                setStyleAttribute(el, style, newValue[style]);
              }
            }
          }
        } else {
          setSvgAttribute(el, edit.n, newValue);
        }
      }
    }
    return root;
  }
  v(block2 = null, refNode = null) {
    insertBefore$.call(this.t(), this.l, block2 ? block2.l : refNode);
  }
  x() {
    remove$$1.call(this.l);
    this.l = null;
  }
  u(_oldProps, _newProps) {
    if (!this._u)
      return true;
    return this._u(_oldProps, _newProps);
  }
  s() {
    return String(this.l?.outerHTML);
  }
  t() {
    if (!this._t)
      this._t = this.l?.parentElement;
    return this._t;
  }
}
const getCurrentElement = (path, root, cache, key) => {
  const pathLength = path.length;
  if (!pathLength)
    return root;
  const isCacheAndKeyExists = cache && key !== void 0;
  if (isCacheAndKeyExists && cache[key]) {
    return cache[key];
  }
  for (let i = 0; i < pathLength; ++i) {
    const siblings = path[i];
    root = childAt(root, siblings);
  }
  if (isCacheAndKeyExists)
    cache[key] = root;
  return root;
};
const withKey = (value, key) => {
  value.key = key;
  return value;
};
const block$ = Block.prototype;
const mount$ = block$.m;
const patch$ = block$.p;
const move$ = block$.v;
const remove$ = block$.x;
const shouldUpdate$ = block$.u;

exports.AbstractBlock = AbstractBlock;
exports.ArrayBlock = ArrayBlock;
exports.Block = Block;
exports.MapGet$ = MapGet$;
exports.MapHas$ = MapHas$;
exports.MapSet$ = MapSet$;
exports.arrayMount$ = arrayMount$;
exports.arrayPatch$ = arrayPatch$;
exports.block = block;
exports.cloneNode$ = cloneNode$;
exports.firstChild$ = firstChild$;
exports.mapArray = mapArray;
exports.mount = mount;
exports.mount$ = mount$;
exports.nextSibling$ = nextSibling$;
exports.patch = patch;
exports.remove$ = remove$;
exports.removeComments = removeComments;
exports.renderToTemplate = renderToTemplate;
exports.stringToDOM = stringToDOM;
exports.withKey = withKey;
