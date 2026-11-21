'use client';
'use strict';

const packages_million = require('../shared/million.7df949cb.cjs');
const React = require('react');
const packages_experimental = require('./experimental.cjs');
const itsFine = require('../shared/million.ff3ce694.cjs');
require('react-dom');

const block = (fn, options = {}) => {
  const noSlot = options?.experimental_noSlot ?? packages_experimental.experimental_options.noSlot;
  let blockTarget = options?.block;
  const defaultType = options?.svg ? itsFine.SVG_RENDER_SCOPE : itsFine.RENDER_SCOPE;
  if (fn) {
    blockTarget = packages_million.block(
      fn,
      itsFine.unwrap,
      options?.shouldUpdate,
      options?.svg
    );
  }
  const MillionBlock = (props, forwardedRef) => {
    const container = itsFine.useContainer();
    const parentRef = itsFine.useNearestParent();
    const hmrTimestamp = props._hmr;
    const ref = React.useRef(null);
    const patch = React.useRef(null);
    const portalRef = React.useRef([]);
    props = itsFine.processProps(props, forwardedRef, portalRef.current);
    patch.current?.(props);
    const effect = React.useCallback(() => {
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
The block element should be the only child of the \`${packages_million.cloneNode$.call(ref.current).outerHTML}\` element.
To avoid this error, \`experimental_options.noSlot\` should be false`)
          );
        }
      }
      if (patch.current === null || hmrTimestamp) {
        packages_million.mount$.call(currentBlock, ref.current, null);
        patch.current = (props2) => {
          packages_million.patch(
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
        packages_million.remove$.call(currentBlock);
      };
    }, []);
    const marker = React.useMemo(() => {
      if (noSlot) {
        return null;
      }
      return React.createElement(options?.as ?? defaultType, { ref });
    }, []);
    const childrenSize = portalRef.current.length;
    const children = new Array(childrenSize);
    for (let i = 0; i < childrenSize; ++i) {
      children[i] = portalRef.current[i]?.portal;
    }
    const vnode = React.createElement(
      React.Fragment,
      {},
      marker,
      React.createElement(itsFine.Effect, {
        effect,
        deps: hmrTimestamp ? [hmrTimestamp] : []
      }),
      children
    );
    return vnode;
  };
  if (!packages_million.MapHas$.call(itsFine.REGISTRY, MillionBlock)) {
    packages_million.MapSet$.call(itsFine.REGISTRY, MillionBlock, block);
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
  const ref = React.useRef(null);
  const [portals] = React.useState(() => ({
    current: Array(each.length)
  }));
  const fragmentRef = React.useRef(null);
  const cache = React.useRef({
    each: null,
    children: null,
    mounted: false
  });
  const [, setMountPortals] = React.useState(false);
  if (fragmentRef.current && (each !== cache.current.each || !memo2)) {
    const newChildren = createChildren(each, children, cache, portals, memo2);
    packages_million.arrayPatch$.call(fragmentRef.current, packages_million.mapArray(newChildren));
  }
  const defaultType = svg ? itsFine.SVG_RENDER_SCOPE : itsFine.RENDER_SCOPE;
  const MillionFor = React.createElement(
    React.Fragment,
    null,
    React.createElement(as ?? defaultType, { ...rest, ref }),
    ...portals.current.map((p) => p.portal)
  );
  React.useEffect(() => {
    if (!ref.current || fragmentRef.current)
      return;
    if (cache.current.mounted)
      return;
    const newChildren = createChildren(each, children, cache, portals, memo2);
    fragmentRef.current = packages_million.mapArray(newChildren);
    if (!packages_million.MapHas$.call(itsFine.REGISTRY, MillionFor)) {
      packages_million.MapSet$.call(itsFine.REGISTRY, MillionFor, fragmentRef.current);
    }
    packages_million.arrayMount$.call(fragmentRef.current, ref.current);
    cache.current.mounted = true;
    setMountPortals(true);
  }, [ref.current]);
  return MillionFor;
};
const typedMemo = React.memo;
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
    if (packages_million.MapHas$.call(itsFine.REGISTRY, vnode.type)) {
      if (!currentCache.block) {
        currentCache.block = packages_million.MapGet$.call(itsFine.REGISTRY, vnode.type);
      }
      children[i] = currentCache.block(vnode.props, portals, i);
      continue;
    }
    if (typeof vnode.type === "function" && "_c" in vnode.type) {
      const puppetComponent = vnode.type(vnode.props);
      if (packages_million.MapHas$.call(itsFine.REGISTRY, puppetComponent.type)) {
        const puppetBlock = packages_million.MapGet$.call(itsFine.REGISTRY, puppetComponent.type);
        if (typeof puppetBlock === "function") {
          children[i] = puppetBlock(puppetComponent.props);
          continue;
        }
      }
    }
    const block = packages_million.block((props) => props?.scope);
    const currentBlock = (props, portals2, index) => {
      return block(
        {
          scope: itsFine.renderReactScope(
            React.createElement(vnode.type, props),
            false,
            portals2.current,
            index
          )
        },
        vnode.key ? String(vnode.key) : void 0
      );
    };
    packages_million.MapSet$.call(itsFine.REGISTRY, vnode.type, currentBlock);
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
    const scoped = React.useContext(itsFine.scopedContext);
    const [current] = React.useState(() => []);
    const derived = { ...props, scoped };
    for (let i = 0; i < portalCount; i++) {
      const index = portals[i];
      const scope = itsFine.renderReactScope(
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
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(RenderBlock, derived),
      targets
    );
  } : (props) => React.createElement(RenderBlock, props);
  if (options.name) {
    Component.displayName = `Million(CompiledBlock(Outer(${options.name})))`;
  }
  return Component;
}

const INTERNALS = {
  block: packages_million.block,
  patch: packages_million.patch,
  mount: packages_million.mount
};
if (typeof window !== "undefined") {
  window.__MILLION_DATA__ = {
    version: "3.1.11"
  };
}

exports.removeComments = packages_million.removeComments;
exports.REGISTRY = itsFine.REGISTRY;
exports.renderReactScope = itsFine.renderReactScope;
exports.unwrap = itsFine.unwrap;
exports.For = For;
exports.INTERNALS = INTERNALS;
exports.block = block;
exports.compiledBlock = compiledBlock;
