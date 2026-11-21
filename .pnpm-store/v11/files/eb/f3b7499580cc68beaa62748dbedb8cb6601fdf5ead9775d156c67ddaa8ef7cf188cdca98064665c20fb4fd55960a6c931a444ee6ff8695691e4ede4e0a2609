'use client';
'use strict';

const React = require('react');
const reactDom = require('react-dom');

const RENDER_SCOPE = "slot";
const SVG_RENDER_SCOPE = "g";
const Effect = ({
  effect,
  deps
}) => {
  React.useEffect(effect, deps || []);
  return null;
};
const REGISTRY = /* @__PURE__ */ new Map();

const scopedContext = React.createContext(false);
const processProps = (props, ref, portals) => {
  const processedProps = { ref };
  let currentIndex = 0;
  for (const key in props) {
    const value = props[key];
    if (React.isValidElement(value) || Array.isArray(value) && value.length && React.isValidElement(value[0])) {
      processedProps[key] = renderReactScope(
        value,
        false,
        portals,
        currentIndex++
      );
      continue;
    }
    processedProps[key] = props[key];
  }
  return processedProps;
};
const wrap = (vnode, key) => {
  return React.createElement(
    RENDER_SCOPE,
    { suppressHydrationWarning: true, id: key },
    vnode
  );
};
const renderReactScope = (vnode, unstable, portals, currentIndex, key) => {
  const el = portals?.[currentIndex]?.current;
  const isBlock = React.isValidElement(vnode) && typeof vnode.type === "function" && "_c" in vnode.type;
  const isCallable = isBlock && vnode.type._c;
  if (typeof window === "undefined") {
    if (isBlock) {
      if (isCallable) {
        return vnode;
      }
      return wrap(wrap(vnode), key);
    }
    return wrap(vnode, key);
  }
  if (isCallable) {
    const puppetComponent = vnode.type(vnode.props);
    if (REGISTRY.has(puppetComponent.type)) {
      const puppetBlock = REGISTRY.get(puppetComponent.type);
      if (typeof puppetBlock === "function") {
        return puppetBlock(puppetComponent.props);
      }
    }
  }
  const current = el ?? (key ? document.getElementById(key) : null) ?? document.createElement(RENDER_SCOPE);
  const reactPortal = reactDom.createPortal(
    React.createElement(React.Fragment, { children: vnode }),
    current,
    key
  );
  const millionPortal = {
    foreign: true,
    current,
    portal: reactPortal,
    reset: (child) => {
      child.childNodes.forEach((cn) => child.removeChild(cn));
    },
    unstable
  };
  if (portals) {
    portals[currentIndex] = millionPortal;
  }
  return millionPortal;
};
const unwrap = (vnode) => {
  if (typeof vnode !== "object" || vnode === null || !("type" in vnode)) {
    if (typeof vnode === "number") {
      return String(vnode);
    }
    return vnode;
  }
  let type = vnode.type;
  if (typeof type === "function") {
    return unwrap(type(vnode.props ?? {}));
  }
  if (typeof type === "object" && "$" in type)
    return type;
  const props = { ...vnode.props };
  if ("css" in props && "__EMOTION_TYPE_PLEASE_DO_NOT_USE__" in props) {
    props.style = props.css.styles;
    type = props.__EMOTION_TYPE_PLEASE_DO_NOT_USE__;
    delete props.__EMOTION_TYPE_PLEASE_DO_NOT_USE__;
    delete props.css;
  }
  const children = vnode.props?.children;
  if (children !== void 0 && children !== null) {
    props.children = flatten(vnode.props.children).map(
      (child) => unwrap(child)
    );
  }
  return {
    type,
    // lets pretend no function go through
    props
  };
};
const flatten = (rawChildren) => {
  if (rawChildren === void 0 || rawChildren === null)
    return [];
  if (typeof rawChildren === "object" && "type" in rawChildren && rawChildren.type === React.Fragment) {
    return flatten(rawChildren.props.children);
  }
  if (!Array.isArray(rawChildren) || typeof rawChildren === "object" && "$" in rawChildren) {
    return [rawChildren];
  }
  const flattenedChildren = rawChildren.flat(Infinity);
  const children = [];
  for (let i = 0, l = flattenedChildren.length; i < l; ++i) {
    children.push(...flatten(flattenedChildren[i]));
  }
  return children;
};

const useLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
function traverse(fiber, selector, ascending) {
  if (!fiber || selector(fiber))
    return fiber;
  let child = ascending ? fiber.return : fiber.child;
  while (child) {
    const match = traverse(child, selector, ascending);
    if (match)
      return match;
    child = ascending ? null : child.sibling;
  }
}
function useFiber() {
  const fiber = React.useRef();
  React.useState(() => {
    const bind = Function.prototype.bind;
    Function.prototype.bind = function(self, maybeFiber) {
      if (self === null && typeof maybeFiber?.type === "function") {
        fiber.current = maybeFiber;
        Function.prototype.bind = bind;
      }
      return bind.apply(this, arguments);
    };
  });
  return fiber.current;
}
function useNearestParent(type) {
  const fiber = useFiber();
  const parentRef = React.useRef({ el: null, depth: 0 });
  useLayoutEffect(() => {
    parentRef.current.el = traverse(
      fiber,
      (node) => {
        parentRef.current.depth++;
        return typeof node.type === "string" && (type === void 0 || node.type === type);
      },
      true
    )?.stateNode;
  }, [fiber]);
  return parentRef;
}
function useContainer() {
  const fiber = useFiber();
  const rootRef = React.useRef({ el: null, depth: 0 });
  useLayoutEffect(() => {
    rootRef.current.el = traverse(
      fiber,
      (node) => {
        rootRef.current.depth++;
        return node.stateNode?.containerInfo != null;
      },
      true
    )?.stateNode.containerInfo;
  }, [fiber]);
  return rootRef;
}

exports.Effect = Effect;
exports.REGISTRY = REGISTRY;
exports.RENDER_SCOPE = RENDER_SCOPE;
exports.SVG_RENDER_SCOPE = SVG_RENDER_SCOPE;
exports.processProps = processProps;
exports.renderReactScope = renderReactScope;
exports.scopedContext = scopedContext;
exports.unwrap = unwrap;
exports.useContainer = useContainer;
exports.useNearestParent = useNearestParent;
