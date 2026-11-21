'use client';
import { useEffect, createContext, isValidElement, createElement, Fragment, useRef, useLayoutEffect as useLayoutEffect$1, useState } from 'react';
import { createPortal } from 'react-dom';

const RENDER_SCOPE = "slot";
const SVG_RENDER_SCOPE = "g";
const Effect = ({
  effect,
  deps
}) => {
  useEffect(effect, deps || []);
  return null;
};
const REGISTRY = /* @__PURE__ */ new Map();

const scopedContext = createContext(false);
const processProps = (props, ref, portals) => {
  const processedProps = { ref };
  let currentIndex = 0;
  for (const key in props) {
    const value = props[key];
    if (isValidElement(value) || Array.isArray(value) && value.length && isValidElement(value[0])) {
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
  return createElement(
    RENDER_SCOPE,
    { suppressHydrationWarning: true, id: key },
    vnode
  );
};
const renderReactScope = (vnode, unstable, portals, currentIndex, key) => {
  const el = portals?.[currentIndex]?.current;
  const isBlock = isValidElement(vnode) && typeof vnode.type === "function" && "_c" in vnode.type;
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
  const reactPortal = createPortal(
    createElement(Fragment, { children: vnode }),
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
  if (typeof rawChildren === "object" && "type" in rawChildren && rawChildren.type === Fragment) {
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

const useLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect$1;
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
  const fiber = useRef();
  useState(() => {
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
  const parentRef = useRef({ el: null, depth: 0 });
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
  const rootRef = useRef({ el: null, depth: 0 });
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

export { Effect as E, RENDER_SCOPE as R, SVG_RENDER_SCOPE as S, REGISTRY as a, useContainer as b, useNearestParent as c, processProps as p, renderReactScope as r, scopedContext as s, unwrap as u };
