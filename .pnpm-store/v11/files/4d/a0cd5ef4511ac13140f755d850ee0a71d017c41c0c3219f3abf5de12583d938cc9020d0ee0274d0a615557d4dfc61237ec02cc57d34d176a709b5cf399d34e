'use client';
import { b as block$1, M as MapHas$, a as MapSet$, c as cloneNode$, m as mount$, p as patch, r as remove$, d as arrayPatch$, e as mapArray, f as arrayMount$, g as MapGet$, h as mount } from '../shared/million.b61aa45e.mjs';
export { i as removeComments } from '../shared/million.b61aa45e.mjs';
import { useRef, useCallback, useMemo, createElement, Fragment, useState, useEffect, memo, useContext } from 'react';
import { experimental_options } from './experimental.mjs';
import { S as SVG_RENDER_SCOPE, R as RENDER_SCOPE, u as unwrap, a as REGISTRY, b as useContainer, c as useNearestParent, p as processProps, E as Effect, r as renderReactScope, s as scopedContext } from '../shared/million.9efd57f2.mjs';
import 'react-dom';

const block = (fn, options = {}) => {
  const noSlot = options?.experimental_noSlot ?? experimental_options.noSlot;
  let blockTarget = options?.block;
  const defaultType = options?.svg ? SVG_RENDER_SCOPE : RENDER_SCOPE;
  if (fn) {
    blockTarget = block$1(
      fn,
      unwrap,
      options?.shouldUpdate,
      options?.svg
    );
  }
  const MillionBlock = (props, forwardedRef) => {
    const container = useContainer();
    const parentRef = useNearestParent();
    const hmrTimestamp = props._hmr;
    const ref = useRef(null);
    const patch$1 = useRef(null);
    const portalRef = useRef([]);
    props = processProps(props, forwardedRef, portalRef.current);
    patch$1.current?.(props);
    const effect = useCallback(() => {
      if (!ref.current && !noSlot)
        return;
      const currentBlock = blockTarget(props, props.key);
      if (hmrTimestamp && ref.current?.textContent) {
        ref.current.textContent = "";
      }
      if (noSlot) {
        ref.current = parentRef.current?.el ?? container.current?.el;
        if (props.scoped || parentRef.current && container.current && parentRef.current.depth > container.current.depth) {
          ref.current = container.current.el;
        }
        if (ref.current.childNodes.length) {
          console.error(
            new Error(`\`experimental_options.noSlot\` does not support having siblings at the moment.
The block element should be the only child of the \`${cloneNode$.call(ref.current).outerHTML}\` element.
To avoid this error, \`experimental_options.noSlot\` should be false`)
          );
        }
      }
      if (patch$1.current === null || hmrTimestamp) {
        mount$.call(currentBlock, ref.current, null);
        patch$1.current = (props2) => {
          patch(
            currentBlock,
            blockTarget(
              props2,
              props2.key,
              options?.shouldUpdate
            )
          );
        };
      }
      return () => {
        remove$.call(currentBlock);
      };
    }, []);
    const marker = useMemo(() => {
      if (noSlot) {
        return null;
      }
      return createElement(options?.as ?? defaultType, { ref });
    }, []);
    const childrenSize = portalRef.current.length;
    const children = new Array(childrenSize);
    for (let i = 0; i < childrenSize; ++i) {
      children[i] = portalRef.current[i]?.portal;
    }
    const vnode = createElement(
      Fragment,
      {},
      marker,
      createElement(Effect, {
        effect,
        deps: hmrTimestamp ? [hmrTimestamp] : []
      }),
      children
    );
    return vnode;
  };
  if (!MapHas$.call(REGISTRY, MillionBlock)) {
    MapSet$.call(REGISTRY, MillionBlock, block);
  }
  if (options?.name) {
    if (fn) {
      fn.displayName = `Million(Render(${options.name}))`;
    }
    MillionBlock.displayName = `Million(Block(${options.name}))`;
  }
  return MillionBlock;
};

const MillionArray = ({
  each,
  children,
  memo: memo2,
  svg,
  as,
  ...rest
}) => {
  const ref = useRef(null);
  const [portals] = useState(() => ({
    current: Array(each.length)
  }));
  const fragmentRef = useRef(null);
  const cache = useRef({
    each: null,
    children: null,
    mounted: false
  });
  const [, setMountPortals] = useState(false);
  if (fragmentRef.current && (each !== cache.current.each || !memo2)) {
    const newChildren = createChildren(each, children, cache, portals, memo2);
    arrayPatch$.call(fragmentRef.current, mapArray(newChildren));
  }
  const defaultType = svg ? SVG_RENDER_SCOPE : RENDER_SCOPE;
  const MillionFor = createElement(
    Fragment,
    null,
    createElement(as ?? defaultType, { ...rest, ref }),
    ...portals.current.map((p) => p.portal)
  );
  useEffect(() => {
    if (!ref.current || fragmentRef.current)
      return;
    if (cache.current.mounted)
      return;
    const newChildren = createChildren(each, children, cache, portals, memo2);
    fragmentRef.current = mapArray(newChildren);
    if (!MapHas$.call(REGISTRY, MillionFor)) {
      MapSet$.call(REGISTRY, MillionFor, fragmentRef.current);
    }
    arrayMount$.call(fragmentRef.current, ref.current);
    cache.current.mounted = true;
    setMountPortals(true);
  }, [ref.current]);
  return MillionFor;
};
const typedMemo = memo;
const For = typedMemo(MillionArray);
const createChildren = (each, getComponent, cache, portals, memo2) => {
  const children = Array(each.length);
  const currentCache = cache.current;
  for (let i = 0, l = each.length; i < l; ++i) {
    if (memo2 && currentCache.each && currentCache.each[i] === each[i]) {
      children[i] = currentCache.children?.[i];
      continue;
    }
    const vnode = getComponent(each[i], i);
    if (MapHas$.call(REGISTRY, vnode.type)) {
      if (!currentCache.block) {
        currentCache.block = MapGet$.call(REGISTRY, vnode.type);
      }
      children[i] = currentCache.block(vnode.props, portals, i);
      continue;
    }
    if (typeof vnode.type === "function" && "_c" in vnode.type) {
      const puppetComponent = vnode.type(vnode.props);
      if (MapHas$.call(REGISTRY, puppetComponent.type)) {
        const puppetBlock = MapGet$.call(REGISTRY, puppetComponent.type);
        if (typeof puppetBlock === "function") {
          children[i] = puppetBlock(puppetComponent.props);
          continue;
        }
      }
    }
    const block = block$1((props) => props?.scope);
    const currentBlock = (props, portals2, index) => {
      return block(
        {
          scope: renderReactScope(
            createElement(vnode.type, props),
            false,
            portals2.current,
            index
          )
        },
        vnode.key ? String(vnode.key) : void 0
      );
    };
    MapSet$.call(REGISTRY, vnode.type, currentBlock);
    currentCache.block = currentBlock;
    children[i] = currentBlock(vnode.props, portals, i);
  }
  currentCache.each = each;
  currentCache.children = children;
  return children;
};

function isEqual(a, b) {
  return a === b || a !== a && b !== b;
}
function shouldCompiledBlockUpdate(prev, next) {
  for (const key in prev) {
    if (!isEqual(prev[key], next[key])) {
      return true;
    }
  }
  return false;
}
function compiledBlock(render, { portals, ...options }) {
  const blockName = `CompiledBlock(Inner(${options.name}))`;
  const RenderBlock = block((props) => render(props), {
    ...options,
    scoped: void 0,
    name: blockName,
    shouldUpdate: shouldCompiledBlockUpdate
  });
  const portalCount = portals?.length || 0;
  const Component = portals && portalCount > 0 ? (props) => {
    const scoped = useContext(scopedContext);
    const [current] = useState(() => []);
    const derived = { ...props, scoped };
    for (let i = 0; i < portalCount; i++) {
      const index = portals[i];
      const scope = renderReactScope(
        derived[index],
        false,
        current,
        i
      );
      derived[index] = scope;
    }
    const targets = [];
    for (let i = 0, len = current.length; i < len; i++) {
      targets[i] = current[i].portal;
    }
    return createElement(
      Fragment,
      null,
      createElement(RenderBlock, derived),
      targets
    );
  } : (props) => createElement(RenderBlock, props);
  if (options.name) {
    Component.displayName = `Million(CompiledBlock(Outer(${options.name})))`;
  }
  return Component;
}

const INTERNALS = {
  block: block$1,
  patch,
  mount
};
if (typeof window !== "undefined") {
  window.__MILLION_DATA__ = {
    version: "3.1.11"
  };
}

export { For, INTERNALS, REGISTRY, block, compiledBlock, renderReactScope, unwrap };
