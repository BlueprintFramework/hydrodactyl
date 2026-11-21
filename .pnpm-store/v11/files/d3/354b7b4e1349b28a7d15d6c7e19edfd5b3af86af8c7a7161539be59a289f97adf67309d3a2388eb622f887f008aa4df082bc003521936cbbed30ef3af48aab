(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
    (global = global || self, factory(global.styled = {}, global.React));
})(this, (function (exports, React) { 'use strict';

    var _a$1, _b;
    const SC_ATTR = (typeof process !== 'undefined' &&
        typeof process.env !== 'undefined' &&
        (process.env.REACT_APP_SC_ATTR || process.env.SC_ATTR)) ||
        'data-styled';
    const SC_ATTR_ACTIVE = 'active';
    const SC_ATTR_VERSION = 'data-styled-version';
    const SC_VERSION = "6.4.3";
    const SPLITTER = '/*!sc*/\n';
    const IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';
    function readSpeedyFlag(name) {
        if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
            const val = process.env[name];
            if (val !== undefined && val !== '') {
                return val !== 'false';
            }
        }
        return undefined;
    }
    const DISABLE_SPEEDY = Boolean(typeof SC_DISABLE_SPEEDY === 'boolean'
        ? SC_DISABLE_SPEEDY
        : ((_b = (_a$1 = readSpeedyFlag('REACT_APP_SC_DISABLE_SPEEDY')) !== null && _a$1 !== void 0 ? _a$1 : readSpeedyFlag('SC_DISABLE_SPEEDY')) !== null && _b !== void 0 ? _b : (typeof process !== 'undefined' && typeof process.env !== 'undefined'
            ? "development" !== 'production'
            : false)));
    const KEYFRAMES_ID_PREFIX = 'sc-keyframes-';
    // Shared empty execution context when generating static styles
    const STATIC_EXECUTION_CONTEXT = {};

    const EMPTY_ARRAY = Object.freeze([]);
    const EMPTY_OBJECT = Object.freeze({});

    /**
     * If the Object prototype is frozen, the "toString" property is non-writable. This means that any objects which inherit this property
     * cannot have the property changed using a "=" assignment operator. If using strict mode, attempting that will cause an error. If not using
     * strict mode, attempting that will be silently ignored.
     *
     * If the Object prototype is frozen, inherited non-writable properties can still be shadowed using one of two mechanisms:
     *
     *  1. ES6 class methods: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#methods
     *  2. Using the `Object.defineProperty()` static method:
     *     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
     *
     * However, this project uses Babel to transpile ES6 classes, and transforms ES6 class methods to use the assignment operator instead:
     * https://babeljs.io/docs/babel-plugin-transform-class-properties#options
     *
     * Therefore, the most compatible way to shadow the prototype's "toString" property is to define a new "toString" property on this object.
     */
    function setToString(object, toStringFn) {
        Object.defineProperty(object, 'toString', { value: toStringFn });
    }

    var errorMap = { "1": "Cannot create styled-component for component: %s.\n\n", "2": "Can't collect styles once you've consumed a `ServerStyleSheet`'s styles! `ServerStyleSheet` is a one off instance for each server-side render cycle.\n\n- Are you trying to reuse it across renders?\n- Are you accidentally calling collectStyles twice?\n\n", "3": "Streaming SSR is only supported in a Node.js environment; Please do not try to call this method in the browser.\n\n", "4": "The `StyleSheetManager` expects a valid target or sheet prop!\n\n- Does this error occur on the client and is your target falsy?\n- Does this error occur on the server and is the sheet falsy?\n\n", "5": "The clone method cannot be used on the client!\n\n- Are you running in a client-like environment on the server?\n- Are you trying to run SSR on the client?\n\n", "6": "Trying to insert a new style tag, but the given Node is unmounted!\n\n- Are you using a custom target that isn't mounted?\n- Does your document not have a valid head element?\n- Have you accidentally removed a style tag manually?\n\n", "7": "ThemeProvider: Please return an object from your \"theme\" prop function, e.g.\n\n```js\ntheme={() => ({})}\n```\n\n", "8": "ThemeProvider: Please make your \"theme\" prop an object.\n\n", "9": "Missing document `<head>`\n\n", "10": "Cannot find a StyleSheet instance. Usually this happens if there are multiple copies of styled-components loaded at once. Check out this issue for how to troubleshoot and fix the common cases where this situation can happen: https://github.com/styled-components/styled-components/issues/1941#issuecomment-417862021\n\n", "11": "_This error was replaced with a dev-time warning, it will be deleted for v4 final._ [createGlobalStyle] received children which will not be rendered. Please use the component without passing children elements.\n\n", "12": "It seems you are interpolating a keyframe declaration (%s) into an untagged string. Please wrap your string in the css\\`\\` helper which ensures the styles are injected correctly. See https://styled-components.com/docs/api#css\n\n", "13": "%s is not a styled component and cannot be referred to via component selector. See https://styled-components.com/docs/advanced#referring-to-other-components for more details.\n\n", "14": "ThemeProvider: \"theme\" prop is required.\n\n", "15": "A stylis plugin has been supplied that is not named. We need a name for each plugin to be able to prevent styling collisions between different stylis configurations within the same app. Before you pass your plugin to `<StyleSheetManager stylisPlugins={[]}>`, please make sure each plugin is uniquely-named, e.g.\n\n```js\nObject.defineProperty(importedPlugin, 'name', { value: 'some-unique-name' });\n```\n\n", "16": "Reached the limit of how many styled components may be created at group %s.\nYou may only create up to 1,073,741,824 components. If you're creating components dynamically,\nas for instance in your render method then you may be running into this limitation.\n\n", "17": "CSSStyleSheet could not be found on HTMLStyleElement.\nHas styled-components' style tag been unmounted or altered by another script?\n\n", "18": "Accessing `useTheme` hook outside of a `<ThemeProvider>` element.\n\n```jsx\nimport { useTheme } from 'styled-components';\nexport function StyledCompoent({ children }) {\n  const theme = useTheme();\n  return <div style={{ width: theme.sizes.full }}>{children}</div>;\n}\n\nimport { StyledComponent } from './StyledComponent';\nimport { theme } from './theme';\nexport function App() {\n  return (\n    <ThemeProvider theme={theme}>\n      <StyledComponent />\n    </ThemeProvider>\n  );\n}\n```\n\nIf you need access to the theme in an uncertain composition scenario, `React.useContext(ThemeContext)` will not emit an error if there is no `ThemeProvider` ancestor.\n" };

    const ERRORS = errorMap ;
    /**
     * super basic version of sprintf
     */
    function format(...args) {
        let a = args[0];
        const b = [];
        for (let c = 1, len = args.length; c < len; c += 1) {
            b.push(args[c]);
        }
        b.forEach(d => {
            a = a.replace(/%[a-z]/, d);
        });
        return a;
    }
    /**
     * Create an error file out of errors.md for development and a simple web link to the full errors
     * in production mode.
     */
    function throwStyledComponentsError(code, ...interpolations) {
        {
            return new Error(format(ERRORS[code], ...interpolations).trim());
        }
    }

    /** Create a GroupedTag with an underlying Tag implementation */
    const makeGroupedTag = (tag) => {
        return new DefaultGroupedTag(tag);
    };
    const BASE_SIZE = 1 << 9;
    const DefaultGroupedTag = class DefaultGroupedTag {
        constructor(tag) {
            this.groupSizes = new Uint32Array(BASE_SIZE);
            this.length = BASE_SIZE;
            this.tag = tag;
            this._cGroup = 0;
            this._cIndex = 0;
        }
        indexOfGroup(group) {
            if (group === this._cGroup)
                return this._cIndex;
            let index = this._cIndex;
            if (group > this._cGroup) {
                for (let i = this._cGroup; i < group; i++) {
                    index += this.groupSizes[i];
                }
            }
            else {
                for (let i = this._cGroup - 1; i >= group; i--) {
                    index -= this.groupSizes[i];
                }
            }
            this._cGroup = group;
            this._cIndex = index;
            return index;
        }
        insertRules(group, rules) {
            if (group >= this.groupSizes.length) {
                const oldBuffer = this.groupSizes;
                const oldSize = oldBuffer.length;
                let newSize = oldSize;
                while (group >= newSize) {
                    newSize <<= 1;
                    if (newSize < 0) {
                        throw throwStyledComponentsError(16, `${group}`);
                    }
                }
                this.groupSizes = new Uint32Array(newSize);
                this.groupSizes.set(oldBuffer);
                this.length = newSize;
                for (let i = oldSize; i < newSize; i++) {
                    this.groupSizes[i] = 0;
                }
            }
            let ruleIndex = this.indexOfGroup(group + 1);
            let insertedCount = 0;
            for (let i = 0, l = rules.length; i < l; i++) {
                if (this.tag.insertRule(ruleIndex, rules[i])) {
                    this.groupSizes[group]++;
                    ruleIndex++;
                    insertedCount++;
                }
            }
            // Keep cache consistent: groups after the insertion point shift forward
            if (insertedCount > 0 && this._cGroup > group) {
                this._cIndex += insertedCount;
            }
        }
        clearGroup(group) {
            if (group < this.length) {
                const length = this.groupSizes[group];
                const startIndex = this.indexOfGroup(group);
                const endIndex = startIndex + length;
                this.groupSizes[group] = 0;
                for (let i = startIndex; i < endIndex; i++) {
                    this.tag.deleteRule(startIndex);
                }
                // Keep cache consistent: groups after the cleared group shift backward
                if (length > 0 && this._cGroup > group) {
                    this._cIndex -= length;
                }
            }
        }
        getGroup(group) {
            let css = '';
            if (group >= this.length || this.groupSizes[group] === 0) {
                return css;
            }
            const length = this.groupSizes[group];
            const startIndex = this.indexOfGroup(group);
            const endIndex = startIndex + length;
            for (let i = startIndex; i < endIndex; i++) {
                css += this.tag.getRule(i) + SPLITTER;
            }
            return css;
        }
    };

    const MAX_SMI = 1 << (31 - 1);
    let groupIDRegister = new Map();
    let reverseRegister = new Map();
    let nextFreeGroup = 1;
    const getGroupForId = (id) => {
        if (groupIDRegister.has(id)) {
            return groupIDRegister.get(id);
        }
        while (reverseRegister.has(nextFreeGroup)) {
            nextFreeGroup++;
        }
        const group = nextFreeGroup++;
        if (((group | 0) < 0 || group > MAX_SMI)) {
            throw throwStyledComponentsError(16, `${group}`);
        }
        groupIDRegister.set(id, group);
        reverseRegister.set(group, id);
        return group;
    };
    const getIdForGroup = (group) => {
        return reverseRegister.get(group);
    };
    const setGroupForId = (id, group) => {
        // move pointer
        nextFreeGroup = group + 1;
        groupIDRegister.set(id, group);
        reverseRegister.set(group, id);
    };

    const SELECTOR = `style[${SC_ATTR}][${SC_ATTR_VERSION}="${SC_VERSION}"]`;
    const MARKER_RE = new RegExp(`^${SC_ATTR}\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)`);
    /**
     * Type guard to check if a node is a ShadowRoot.
     * Uses instanceof when available, with duck-typing fallback for cross-realm scenarios.
     */
    const isShadowRoot = (node) => {
        return ((typeof ShadowRoot !== 'undefined' && node instanceof ShadowRoot) ||
            ('host' in node &&
                // https://dom.spec.whatwg.org/#dom-node-document_fragment_node
                node.nodeType === 11));
    };
    /**
     * Extract the container (Document or ShadowRoot) from an InsertionTarget.
     * If the target is a ShadowRoot, return it directly.
     * If the target is an HTMLElement, return its root node if it's a ShadowRoot, otherwise return document.
     */
    const getRehydrationContainer = (target) => {
        if (!target) {
            return document;
        }
        // Check if target is a ShadowRoot
        if (isShadowRoot(target)) {
            return target;
        }
        // Check if target is an HTMLElement inside a ShadowRoot
        if ('getRootNode' in target) {
            const root = target.getRootNode();
            if (isShadowRoot(root)) {
                return root;
            }
        }
        return document;
    };
    const outputSheet = (sheet) => {
        const tag = sheet.getTag();
        const { length } = tag;
        let css = '';
        for (let group = 0; group < length; group++) {
            const id = getIdForGroup(group);
            if (id === undefined)
                continue;
            const names = sheet.names.get(id);
            if (names === undefined || !names.size)
                continue;
            const rules = tag.getGroup(group);
            if (rules.length === 0)
                continue;
            const selector = SC_ATTR + '.g' + group + '[id="' + id + '"]';
            let content = '';
            for (const name of names) {
                if (name.length > 0) {
                    content += name + ',';
                }
            }
            // NOTE: It's easier to collect rules and have the marker
            // after the actual rules to simplify the rehydration
            css += rules + selector + '{content:"' + content + '"}' + SPLITTER;
        }
        return css;
    };
    const rehydrateNamesFromContent = (sheet, id, content) => {
        const names = content.split(',');
        let name;
        for (let i = 0, l = names.length; i < l; i++) {
            if ((name = names[i])) {
                sheet.registerName(id, name);
            }
        }
    };
    const rehydrateSheetFromTag = (sheet, style) => {
        var _a;
        const parts = ((_a = style.textContent) !== null && _a !== void 0 ? _a : '').split(SPLITTER);
        const rules = [];
        for (let i = 0, l = parts.length; i < l; i++) {
            const part = parts[i].trim();
            if (!part)
                continue;
            const marker = part.match(MARKER_RE);
            if (marker) {
                const group = parseInt(marker[1], 10) | 0;
                const id = marker[2];
                if (group !== 0) {
                    // Rehydrate componentId to group index mapping
                    setGroupForId(id, group);
                    // Rehydrate names and rules
                    // looks like: data-styled.g11[id="idA"]{content:"nameA,"}
                    rehydrateNamesFromContent(sheet, id, marker[3]);
                    sheet.getTag().insertRules(group, rules);
                }
                rules.length = 0;
            }
            else {
                rules.push(part);
            }
        }
    };
    const rehydrateSheet = (sheet) => {
        const container = getRehydrationContainer(sheet.options.target);
        const nodes = container.querySelectorAll(SELECTOR);
        for (let i = 0, l = nodes.length; i < l; i++) {
            const node = nodes[i];
            if (node && node.getAttribute(SC_ATTR) !== SC_ATTR_ACTIVE) {
                rehydrateSheetFromTag(sheet, node);
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }
        }
    };

    /**
     * Resolve a CSP nonce from available sources (in priority order):
     * 1. <meta property="csp-nonce"> (Vite puts nonce in the `nonce` attr)
     * 2. <meta name="sc-nonce"> (SC convention, nonce in `content` attr)
     * 3. __webpack_nonce__ global (legacy)
     *
     * For Next.js/Remix, pass nonces explicitly via StyleSheetManager or
     * ServerStyleSheet instead - auto-detection doesn't apply to header-based nonces.
     */
    let cached = false;
    function getNonce() {
        if (cached !== false)
            return cached;
        if (typeof document !== 'undefined') {
            // Vite sets the nonce in the `nonce` attribute. Browsers expose this via
            // the .nonce DOM property but return "" from getAttribute('nonce').
            const viteMeta = document.head.querySelector('meta[property="csp-nonce"]');
            if (viteMeta)
                return (cached = viteMeta.nonce || viteMeta.getAttribute('content') || undefined);
            const scMeta = document.head.querySelector('meta[name="sc-nonce"]');
            if (scMeta)
                return (cached = scMeta.getAttribute('content') || undefined);
        }
        return (cached = typeof __webpack_nonce__ !== 'undefined' ? __webpack_nonce__ : undefined);
    }

    /** Find last style element if any inside target */
    const findLastStyleTag = (target) => {
        const arr = Array.from(target.querySelectorAll(`style[${SC_ATTR}]`));
        return arr[arr.length - 1];
    };
    /** Create a style element inside `target` or <head> after the last */
    const makeStyleTag = (target, nonce) => {
        const head = document.head;
        const parent = target || head;
        const style = document.createElement('style');
        const prevStyle = findLastStyleTag(parent);
        const nextSibling = prevStyle !== undefined ? prevStyle.nextSibling : null;
        style.setAttribute(SC_ATTR, SC_ATTR_ACTIVE);
        style.setAttribute(SC_ATTR_VERSION, SC_VERSION);
        const resolvedNonce = nonce || getNonce();
        if (resolvedNonce)
            style.setAttribute('nonce', resolvedNonce);
        parent.insertBefore(style, nextSibling);
        return style;
    };
    /** Get the CSSStyleSheet instance for a given style element */
    const getSheet = (tag) => {
        var _a;
        if (tag.sheet) {
            return tag.sheet;
        }
        // Avoid Firefox quirk where the style element might not have a sheet property.
        // Use the tag's root node to find styleSheets - document.styleSheets doesn't
        // include sheets inside shadow roots.
        const root = tag.getRootNode();
        const styleSheets = (_a = root.styleSheets) !== null && _a !== void 0 ? _a : document.styleSheets;
        for (let i = 0, l = styleSheets.length; i < l; i++) {
            const sheet = styleSheets[i];
            if (sheet.ownerNode === tag) {
                return sheet;
            }
        }
        throw throwStyledComponentsError(17);
    };

    /** Create a CSSStyleSheet-like tag depending on the environment */
    const makeTag = ({ isServer, useCSSOMInjection, target, nonce }) => {
        if (useCSSOMInjection) {
            return new CSSOMTag(target, nonce);
        }
        else {
            return new TextTag(target, nonce);
        }
    };
    const CSSOMTag = class CSSOMTag {
        constructor(target, nonce) {
            this.element = makeStyleTag(target, nonce);
            // Avoid Edge bug where empty style elements don't create sheets
            this.element.appendChild(document.createTextNode(''));
            this.sheet = getSheet(this.element);
            this.length = 0;
        }
        insertRule(index, rule) {
            try {
                this.sheet.insertRule(rule, index);
                this.length++;
                return true;
            }
            catch (_error) {
                return false;
            }
        }
        deleteRule(index) {
            this.sheet.deleteRule(index);
            this.length--;
        }
        getRule(index) {
            const rule = this.sheet.cssRules[index];
            // Avoid IE11 quirk where cssText is inaccessible on some invalid rules
            if (rule && rule.cssText) {
                return rule.cssText;
            }
            else {
                return '';
            }
        }
    };
    /** A Tag that emulates the CSSStyleSheet API but uses text nodes */
    const TextTag = class TextTag {
        constructor(target, nonce) {
            this.element = makeStyleTag(target, nonce);
            this.nodes = this.element.childNodes;
            this.length = 0;
        }
        insertRule(index, rule) {
            if (index <= this.length && index >= 0) {
                const node = document.createTextNode(rule);
                const refNode = this.nodes[index];
                this.element.insertBefore(node, refNode || null);
                this.length++;
                return true;
            }
            else {
                return false;
            }
        }
        deleteRule(index) {
            this.element.removeChild(this.nodes[index]);
            this.length--;
        }
        getRule(index) {
            if (index < this.length) {
                return this.nodes[index].textContent;
            }
            else {
                return '';
            }
        }
    };

    let SHOULD_REHYDRATE = IS_BROWSER;
    const defaultOptions = {
        isServer: !IS_BROWSER,
        useCSSOMInjection: !DISABLE_SPEEDY,
    };
    /** Contains the main stylesheet logic for stringification and caching */
    class StyleSheet {
        /** Register a group ID to give it an index */
        static registerId(id) {
            return getGroupForId(id);
        }
        constructor(options = EMPTY_OBJECT, globalStyles = {}, names) {
            this.options = Object.assign(Object.assign({}, defaultOptions), options);
            this.gs = globalStyles;
            this.keyframeIds = new Set();
            this.names = new Map(names);
            this.server = !!options.isServer;
            // We rehydrate only once and use the sheet that is created first
            if (!this.server && IS_BROWSER && SHOULD_REHYDRATE) {
                SHOULD_REHYDRATE = false;
                rehydrateSheet(this);
            }
            setToString(this, () => outputSheet(this));
        }
        rehydrate() {
            if (!this.server && IS_BROWSER) {
                rehydrateSheet(this);
            }
        }
        reconstructWithOptions(options, withNames = true) {
            const newSheet = new StyleSheet(Object.assign(Object.assign({}, this.options), options), this.gs, (withNames && this.names) || undefined);
            newSheet.keyframeIds = new Set(this.keyframeIds);
            // If we're reconstructing with a new target on the client, check if the container changed
            // This handles the case where StyleSheetManager's target prop changes (e.g., from undefined to shadowRoot)
            // We only rehydrate if the container (Document or ShadowRoot) actually changes
            if (!this.server && IS_BROWSER && options.target !== this.options.target) {
                const oldContainer = getRehydrationContainer(this.options.target);
                const newContainer = getRehydrationContainer(options.target);
                if (oldContainer !== newContainer) {
                    rehydrateSheet(newSheet);
                }
            }
            return newSheet;
        }
        allocateGSInstance(id) {
            return (this.gs[id] = (this.gs[id] || 0) + 1);
        }
        /** Lazily initialises a GroupedTag for when it's actually needed */
        getTag() {
            return this.tag || (this.tag = makeGroupedTag(makeTag(this.options)));
        }
        /** Check whether a name is known for caching */
        hasNameForId(id, name) {
            var _a, _b;
            return (_b = (_a = this.names.get(id)) === null || _a === void 0 ? void 0 : _a.has(name)) !== null && _b !== void 0 ? _b : false;
        }
        /** Mark a group's name as known for caching */
        registerName(id, name) {
            getGroupForId(id);
            if (id.startsWith(KEYFRAMES_ID_PREFIX)) {
                this.keyframeIds.add(id);
            }
            const existing = this.names.get(id);
            if (existing) {
                existing.add(name);
            }
            else {
                this.names.set(id, new Set([name]));
            }
        }
        /** Insert new rules which also marks the name as known */
        insertRules(id, name, rules) {
            this.registerName(id, name);
            this.getTag().insertRules(getGroupForId(id), rules);
        }
        /** Clears all cached names for a given group ID */
        clearNames(id) {
            if (this.names.has(id)) {
                this.names.get(id).clear();
            }
        }
        /** Clears all rules for a given group ID */
        clearRules(id) {
            this.getTag().clearGroup(getGroupForId(id));
            this.clearNames(id);
        }
        /** Clears the entire tag which deletes all rules but not its names */
        clearTag() {
            // NOTE: This does not clear the names, since it's only used during SSR
            // so that we can continuously output only new rules
            this.tag = undefined;
        }
    }

    const cssTagged = new WeakSet();

    /**
     * CSS properties that accept unitless numeric values.
     * Inlined from @emotion/unitless with IE-only entries removed
     * (boxFlex, boxFlexGroup, boxOrdinalGroup, flexPositive, flexNegative,
     * flexOrder, msGridRow, msGridRowSpan, msGridColumn, msGridColumnSpan).
     */
    const unitless = {
        animationIterationCount: 1,
        aspectRatio: 1,
        borderImageOutset: 1,
        borderImageSlice: 1,
        borderImageWidth: 1,
        columnCount: 1,
        columns: 1,
        flex: 1,
        flexGrow: 1,
        flexShrink: 1,
        gridRow: 1,
        gridRowEnd: 1,
        gridRowSpan: 1,
        gridRowStart: 1,
        gridColumn: 1,
        gridColumnEnd: 1,
        gridColumnSpan: 1,
        gridColumnStart: 1,
        fontWeight: 1,
        lineHeight: 1,
        opacity: 1,
        order: 1,
        orphans: 1,
        scale: 1,
        tabSize: 1,
        widows: 1,
        zIndex: 1,
        zoom: 1,
        WebkitLineClamp: 1,
        fillOpacity: 1,
        floodOpacity: 1,
        stopOpacity: 1,
        strokeDasharray: 1,
        strokeDashoffset: 1,
        strokeMiterlimit: 1,
        strokeOpacity: 1,
        strokeWidth: 1,
    };
    // Taken from https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/shared/dangerousStyleValue.js
    function addUnitIfNeeded(name, value) {
        // https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/133
        if (value == null || typeof value === 'boolean' || value === '') {
            return '';
        }
        if (typeof value === 'number' && value !== 0 && !(name in unitless) && !name.startsWith('--')) {
            return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers except for CSS variables
        }
        return String(value).trim();
    }

    function getComponentName(target) {
        return ((typeof target === 'string' && target ) ||
            target.displayName ||
            target.name ||
            'Component');
    }

    // Shared character-code constants for fast charCodeAt comparisons.
    // Inlined at call sites by V8 after the first optimization pass.
    const DOUBLE_QUOTE = 34; // "
    const SINGLE_QUOTE = 39; // '
    const SLASH = 47; // /
    const ASTERISK = 42; // *
    const BACKSLASH = 92; // \
    const OPEN_BRACE = 123; // {
    const CLOSE_BRACE = 125; // }
    const SEMICOLON = 59; // ;
    const NEWLINE = 10; // \n
    const OPEN_PAREN = 40; // (
    const CLOSE_PAREN = 41; // )
    const HYPHEN = 45; // -
    const UPPER_A = 65; // A
    const UPPER_Z = 90; // Z
    /** Offset from an ASCII uppercase letter to its lowercase counterpart. */
    const UPPER_TO_LOWER = 32;

    /**
     * Hyphenates a camelcased CSS property name, for example:
     *
     *   > hyphenateStyleName('backgroundColor')
     *   < "background-color"
     *   > hyphenateStyleName('MozTransition')
     *   < "-moz-transition"
     *   > hyphenateStyleName('msTransition')
     *   < "-ms-transition"
     *
     * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
     * is converted to `-ms-`.
     */
    function hyphenateStyleName(string) {
        // CSS variable prefix (`--*`) passes through untouched.
        if (string.charCodeAt(0) === HYPHEN && string.charCodeAt(1) === HYPHEN) {
            return string;
        }
        let output = '';
        for (let i = 0; i < string.length; i++) {
            const code = string.charCodeAt(i);
            if (code >= UPPER_A && code <= UPPER_Z) {
                output += '-' + String.fromCharCode(code + UPPER_TO_LOWER);
            }
            else {
                output += string[i];
            }
        }
        return output.startsWith('ms-') ? '-' + output : output;
    }

    function isFunction(test) {
        return typeof test === 'function';
    }

    const KEYFRAMES_SYMBOL = Symbol.for('sc-keyframes');
    function isKeyframes(value) {
        return typeof value === 'object' && value !== null && KEYFRAMES_SYMBOL in value;
    }

    function isPlainObject(x) {
        return (x !== null &&
            typeof x === 'object' &&
            x.constructor.name === Object.name &&
            /* check for reasonable markers that the object isn't an element for react & preact/compat */
            !('props' in x && x.$$typeof));
    }

    function isStatelessFunction(test) {
        return isFunction(test) && !(test.prototype && test.prototype.isReactComponent);
    }

    const REACT_FORWARD_REF_TYPE$1 = Symbol.for('react.forward_ref');
    /**
     * Type guard that returns true if the target is a styled component.
     *
     * Accepts both `object` and `function` carriers because Preact's react-compat
     * `forwardRef` returns a function while React's returns an object (#5736).
     * `$$typeof` is checked alongside the `styledComponentId` brand so that HOCs
     * which hoist non-React statics from a styled component (and therefore inherit
     * `styledComponentId`) are not mistaken for real styled components - those
     * HOCs do not carry the forward-ref `$$typeof`.
     */
    function isStyledComponent(target) {
        return (target != null &&
            (typeof target === 'object' || typeof target === 'function') &&
            target.$$typeof === REACT_FORWARD_REF_TYPE$1 &&
            'styledComponentId' in target);
    }

    /**
     * It's falsish not falsy because 0 is allowed.
     */
    const isFalsish = (chunk) => chunk === undefined || chunk === null || chunk === false || chunk === '';
    const CLIENT_REFERENCE = Symbol.for('react.client.reference');
    function isClientReference(chunk) {
        return chunk.$$typeof === CLIENT_REFERENCE;
    }
    // React encodes $$id as "modulePath#exportName"
    function warnClientReference(ref) {
        const id = ref.$$id;
        const label = (id && id.includes('#') ? id.split('#').pop() : id) || ref.name || 'unknown';
        console.warn(`Interpolating a client component (${label}) as a selector is not supported in server components. The component selector pattern requires access to the component's internal class name, which is not available across the server/client boundary. Use a plain CSS class selector instead.`);
    }
    /** Internal accumulator form - avoids allocating a temp array per nesting level. */
    function objToCssArrayInto(obj, rules) {
        for (const key in obj) {
            const val = obj[key];
            if (!obj.hasOwnProperty(key) || isFalsish(val))
                continue;
            if ((Array.isArray(val) && cssTagged.has(val)) || isFunction(val)) {
                rules.push(hyphenateStyleName(key) + ':', val, ';');
            }
            else if (isPlainObject(val)) {
                rules.push(key + ' {');
                objToCssArrayInto(val, rules);
                rules.push('}');
            }
            else {
                rules.push(hyphenateStyleName(key) + ': ' + addUnitIfNeeded(key, val) + ';');
            }
        }
    }
    function flatten(chunk, executionContext, styleSheet, stylisInstance, result = []) {
        if (isFalsish(chunk)) {
            return result;
        }
        const t = typeof chunk;
        if (t === 'string') {
            result.push(chunk);
            return result;
        }
        if (t === 'function') {
            if (isClientReference(chunk)) {
                warnClientReference(chunk);
                return result;
            }
            if (isStatelessFunction(chunk) && executionContext) {
                const fnResult = chunk(executionContext);
                if (typeof fnResult === 'object' &&
                    !Array.isArray(fnResult) &&
                    !isKeyframes(fnResult) &&
                    !isPlainObject(fnResult) &&
                    fnResult !== null) {
                    console.error(`${getComponentName(chunk)} is not a styled component and cannot be referred to via component selector. See https://styled-components.com/docs/advanced#referring-to-other-components for more details.`);
                }
                return flatten(fnResult, executionContext, styleSheet, stylisInstance, result);
            }
            else {
                result.push(chunk);
                return result;
            }
        }
        if (Array.isArray(chunk)) {
            for (let i = 0; i < chunk.length; i++) {
                flatten(chunk[i], executionContext, styleSheet, stylisInstance, result);
            }
            return result;
        }
        if (isStyledComponent(chunk)) {
            result.push(`.${chunk.styledComponentId}`);
            return result;
        }
        if (isKeyframes(chunk)) {
            if (styleSheet) {
                chunk.inject(styleSheet, stylisInstance);
                result.push(chunk.getName(stylisInstance));
            }
            else {
                result.push(chunk);
            }
            return result;
        }
        // Module-level client reference proxies (typeof 'object') pass isPlainObject - catch before
        if (isClientReference(chunk)) {
            warnClientReference(chunk);
            return result;
        }
        if (isPlainObject(chunk)) {
            // A plain object that defines its own toString takes the stringification
            // path - it's being interpolated as a value (e.g. a design token), not as
            // a CSS-in-JS rule object. Without this, `${token}` in a tagged template
            // would walk the object's enumerable keys as CSS declarations. (#5740)
            if (chunk.toString !== Object.prototype.toString) {
                result.push(chunk.toString());
                return result;
            }
            objToCssArrayInto(chunk, result);
            return result;
        }
        result.push(chunk.toString());
        return result;
    }

    function isStaticRules(rules) {
        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            if (isFunction(rule) && !isStyledComponent(rule)) {
                // functions are allowed to be static if they're just being
                // used to get the classname of a nested styled component
                return false;
            }
        }
        return true;
    }

    /**
     * Convenience function for joining strings to form className chains
     */
    function joinStrings(a, b) {
        return a && b ? a + ' ' + b : a || b || '';
    }
    function joinStringArray(arr, sep) {
        return arr.join(sep || '');
    }

    class GlobalStyle {
        constructor(rules, componentId) {
            /** @internal Per-instance rule cache for shared-group rebuild. */
            this.instanceRules = new Map();
            this.rules = rules;
            this.componentId = componentId;
            this.isStatic = isStaticRules(rules);
            // Pre-register the shared group so global styles defined before
            // components always appear before them in the stylesheet.
            StyleSheet.registerId(this.componentId);
        }
        removeStyles(instance, styleSheet) {
            this.instanceRules.delete(instance);
            this.rebuildGroup(styleSheet);
        }
        renderStyles(instance, executionContext, styleSheet, stylis) {
            const id = this.componentId;
            if (this.isStatic) {
                if (!styleSheet.hasNameForId(id, id + instance)) {
                    const entry = this.computeRules(instance, executionContext, styleSheet, stylis);
                    styleSheet.insertRules(id, entry.name, entry.rules);
                }
                else if (!this.instanceRules.has(instance)) {
                    // Rehydrated style: populate cache so rebuildGroup can restore
                    // survivors if another instance unmounts.
                    this.computeRules(instance, executionContext, styleSheet, stylis);
                }
                return;
            }
            // Compute new rules; skip CSSOM rebuild if CSS is unchanged.
            // The fast-path is only safe on the client where the tag persists between renders.
            // During SSR, clearTag() destroys the tag between requests, so we must always rebuild.
            const prev = this.instanceRules.get(instance);
            this.computeRules(instance, executionContext, styleSheet, stylis);
            if (!styleSheet.server && prev) {
                const a = prev.rules;
                const b = this.instanceRules.get(instance).rules;
                if (a.length === b.length) {
                    let same = true;
                    for (let i = 0; i < a.length; i++) {
                        if (a[i] !== b[i]) {
                            same = false;
                            break;
                        }
                    }
                    if (same)
                        return;
                }
            }
            this.rebuildGroup(styleSheet);
        }
        computeRules(instance, executionContext, styleSheet, stylis) {
            const flatCSS = joinStringArray(flatten(this.rules, executionContext, styleSheet, stylis));
            const entry = {
                name: this.componentId + instance,
                rules: stylis(flatCSS, ''),
            };
            this.instanceRules.set(instance, entry);
            return entry;
        }
        /**
         * Clear all CSS rules in the shared group and re-insert from surviving instances.
         * Must run synchronously - no yielding between clear and re-insert.
         */
        rebuildGroup(styleSheet) {
            const id = this.componentId;
            styleSheet.clearRules(id);
            for (const entry of this.instanceRules.values()) {
                styleSheet.insertRules(id, entry.name, entry.rules);
            }
        }
    }

    var e="-ms-";var r="-moz-";var a="-webkit-";var c="comm";var n="rule";var s="decl";var i="@import";var v="@namespace";var b="@keyframes";var g="@layer";var $=Math.abs;var m=String.fromCharCode;var x=Object.assign;function y(e,r){return A(e,0)^45?(((r<<2^A(e,0))<<2^A(e,1))<<2^A(e,2))<<2^A(e,3):0}function j(e){return e.trim()}function z(e,r){return (e=r.exec(e))?e[0]:e}function C(e,r,a){return e.replace(r,a)}function O(e,r,a){return e.indexOf(r,a)}function A(e,r){return e.charCodeAt(r)|0}function M(e,r,a){return e.slice(r,a)}function S(e){return e.length}function q(e){return e.length}function B(e,r){return r.push(e),e}function D(e,r){return e.map(r).join("")}function E(e,r){return e.filter((function(e){return !z(e,r)}))}var F=1;var G=1;var H=0;var I=0;var J=0;var K="";function L(e,r,a,c,n,s,t,u){return {value:e,root:r,parent:a,type:c,props:n,children:s,line:F,column:G,length:t,return:"",siblings:u}}function N(e,r){return x(L("",null,null,"",null,null,0,e.siblings),e,{length:-e.length},r)}function P(e){while(e.root)e=N(e.root,{children:[e]});B(e,e.siblings);}function Q(){return J}function R(){J=I>0?A(K,--I):0;if(G--,J===10)G=1,F--;return J}function T(){J=I<H?A(K,I++):0;if(G++,J===10)G=1,F++;return J}function U(){return A(K,I)}function V(){return I}function W(e,r){return M(K,e,r)}function X(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function Y(e){return F=G=1,H=S(K=e),I=0,[]}function Z(e){return K="",e}function _(e){return j(W(I-1,ne(e===91?e+2:e===40?e+1:e)))}function re(e){while(J=U())if(J<33)T();else break;return X(e)>2||X(J)>3?"":" "}function ce(e,r){while(--r&&T())if(J<48||J>102||J>57&&J<65||J>70&&J<97)break;return W(e,V()+(r<6&&U()==32&&T()==32))}function ne(e){while(T())switch(J){case e:return I;case 34:case 39:if(e!==34&&e!==39)ne(J);break;case 40:if(e===41)ne(e);break;case 92:T();break}return I}function se(e,r){while(T())if(e+J===47+10)break;else if(e+J===42+42&&U()===47)break;return "/*"+W(r,I-1)+"*"+m(e===47?e:T())}function te(e){while(!X(U()))T();return W(e,I)}function ue(e){return Z(ie("",null,null,null,[""],e=Y(e),0,[0],e))}function ie(e,r,a,c,n,s,t,u,i){var f=0;var o=0;var l=t;var p=0;var v=0;var b=0;var h=1;var w=1;var d=1;var g=0;var k="";var x=n;var y=s;var j=c;var z=k;while(w)switch(b=g,g=T()){case 40:if(b!=108&&A(z,l-1)==58){if(O(z+=C(_(g),"&","&\f"),"&\f",$(f?u[f-1]:0))!=-1)d=-1;break}case 34:case 39:case 91:z+=_(g);break;case 9:case 10:case 13:case 32:z+=re(b);break;case 92:z+=ce(V()-1,7);continue;case 47:switch(U()){case 42:case 47:B(oe(se(T(),V()),r,a,i),i);if((X(b||1)==5||X(U()||1)==5)&&S(z)&&M(z,-1,void 0)!==" ")z+=" ";break;default:z+="/";}break;case 123*h:u[f++]=S(z)*d;case 125*h:case 59:case 0:switch(g){case 0:case 125:w=0;case 59+o:if(d==-1)z=C(z,/\f/g,"");if(v>0&&(S(z)-l||h===0&&b===47))B(v>32?le(z+";",c,a,l-1,i):le(C(z," ","")+";",c,a,l-2,i),i);break;case 59:z+=";";default:B(j=fe(z,r,a,f,o,n,u,k,x=[],y=[],l,s),s);if(g===123)if(o===0)ie(z,r,j,j,x,s,l,u,y);else {switch(p){case 99:if(A(z,3)===110)break;case 108:if(A(z,2)===97)break;default:o=0;case 100:case 109:case 115:}if(o)ie(e,j,j,c&&B(fe(e,j,j,0,0,n,u,k,n,x=[],l,y),y),n,y,l,u,c?x:y);else ie(z,j,j,j,[""],y,0,u,y);}}f=o=v=0,h=d=1,k=z="",l=t;break;case 58:l=1+S(z),v=b;default:if(h<1)if(g==123)--h;else if(g==125&&h++==0&&R()==125)continue;switch(z+=m(g),g*h){case 38:d=o>0?1:(z+="\f",-1);break;case 44:u[f++]=(S(z)-1)*d,d=1;break;case 64:if(U()===45)z+=_(T());p=U(),o=l=S(k=z+=te(V())),g++;break;case 45:if(b===45&&S(z)==2)h=0;}}return s}function fe(e,r,a,c,s,t,u,i,f,o,l,p){var v=s-1;var b=s===0?t:[""];var h=q(b);for(var w=0,d=0,g=0;w<c;++w)for(var k=0,m=M(e,v+1,v=$(d=u[w])),x=e;k<h;++k)if(x=j(d>0?b[k]+" "+m:C(m,/&\f/g,b[k])))f[g++]=x;return L(e,r,a,s===0?n:i,f,o,l,p)}function oe(e,r,a,n){return L(e,r,a,c,m(Q()),M(e,2,-2),0,n)}function le(e,r,a,c,n){return L(e,r,a,s,M(e,0,c),M(e,c+1,-1),c,n)}function pe(c,n,s){switch(y(c,n)){case 5103:return a+"print-"+c+c;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:case 6391:case 5879:case 5623:case 6135:case 4599:return a+c+c;case 4855:return a+c.replace("add","source-over").replace("substract","source-out").replace("intersect","source-in").replace("exclude","xor")+c;case 4789:return r+c+c;case 5349:case 4246:case 4810:case 6968:case 2756:return a+c+r+c+e+c+c;case 5936:switch(A(c,n+11)){case 114:return a+c+e+C(c,/[svh]\w+-[tblr]{2}/,"tb")+c;case 108:return a+c+e+C(c,/[svh]\w+-[tblr]{2}/,"tb-rl")+c;case 45:return a+c+e+C(c,/[svh]\w+-[tblr]{2}/,"lr")+c}case 6828:case 4268:case 2903:return a+c+e+c+c;case 6165:return a+c+e+"flex-"+c+c;case 5187:return a+c+C(c,/(\w+).+(:[^]+)/,a+"box-$1$2"+e+"flex-$1$2")+c;case 5443:return a+c+e+"flex-item-"+C(c,/flex-|-self/g,"")+(!z(c,/flex-|baseline/)?e+"grid-row-"+C(c,/flex-|-self/g,""):"")+c;case 4675:return a+c+e+"flex-line-pack"+C(c,/align-content|flex-|-self/g,"")+c;case 5548:return a+c+e+C(c,"shrink","negative")+c;case 5292:return a+c+e+C(c,"basis","preferred-size")+c;case 6060:return a+"box-"+C(c,"-grow","")+a+c+e+C(c,"grow","positive")+c;case 4554:return a+C(c,/([^-])(transform)/g,"$1"+a+"$2")+c;case 6187:return C(C(C(c,/(zoom-|grab)/,a+"$1"),/(image-set)/,a+"$1"),c,"")+c;case 5495:case 3959:return C(c,/(image-set\([^]*)/,a+"$1"+"$`$1");case 4968:return C(C(c,/(.+:)(flex-)?(.*)/,a+"box-pack:$3"+e+"flex-pack:$3"),/space-between/,"justify")+a+c+c;case 4200:if(!z(c,/flex-|baseline/))return e+"grid-column-align"+M(c,n)+c;break;case 2592:case 3360:return e+C(c,"template-","")+c;case 4384:case 3616:if(s&&s.some((function(e,r){return n=r,z(e.props,/grid-\w+-end/)}))){return ~O(c+(s=s[n].value),"span",0)?c:e+C(c,"-start","")+c+e+"grid-row-span:"+(~O(s,"span",0)?z(s,/\d+/):+z(s,/\d+/)-+z(c,/\d+/))+";"}return e+C(c,"-start","")+c;case 4896:case 4128:return s&&s.some((function(e){return z(e.props,/grid-\w+-start/)}))?c:e+C(C(c,"-end","-span"),"span ","")+c;case 4095:case 3583:case 4068:case 2532:return C(c,/(.+)-inline(.+)/,a+"$1$2")+c;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(S(c)-1-n>6)switch(A(c,n+1)){case 109:if(A(c,n+4)!==45)break;case 102:return C(c,/(.+:)(.+)-([^]+)/,"$1"+a+"$2-$3"+"$1"+r+(A(c,n+3)==108?"$3":"$2-$3"))+c;case 115:return ~O(c,"stretch",0)?pe(C(c,"stretch","fill-available"),n,s)+c:c}break;case 5152:case 5920:return C(c,/(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/,(function(r,a,n,s,t,u,i){return e+a+":"+n+i+(s?e+a+"-span:"+(t?u:+u-+n)+i:"")+c}));case 4949:if(A(c,n+6)===121)return C(c,":",":"+a)+c;break;case 6444:switch(A(c,A(c,14)===45?18:11)){case 120:return C(c,/(.+:)([^;\s!]+)(;|(\s+)?!.+)?/,"$1"+a+(A(c,14)===45?"inline-":"")+"box$3"+"$1"+a+"$2$3"+"$1"+e+"$2box$3")+c;case 100:return C(c,":",":"+e)+c}break;case 5719:case 2647:case 2135:case 3927:case 2391:return C(c,"scroll-","scroll-snap-")+c}return c}function ve(e,r){var a="";for(var c=0;c<e.length;c++)a+=r(e[c],c,e,r)||"";return a}function be(e,r,a,t){switch(e.type){case g:if(e.children.length)break;case i:case v:case s:return e.return=e.return||e.value;case c:return "";case b:return e.return=e.value+"{"+ve(e.children,t)+"}";case n:if(!S(e.value=e.props.join(",")))return ""}return S(a=ve(e.children,t))?e.return=e.value+"{"+a+"}":""}function he(e){var r=q(e);return function(a,c,n,s){var t="";for(var u=0;u<r;u++)t+=e[u](a,c,n,s)||"";return t}}function we(e){return function(r){if(!r.root)if(r=r.return)e(r);}}function de(c,t,u,i){if(c.length>-1)if(!c.return)switch(c.type){case s:c.return=pe(c.value,c.length,u);return;case b:return ve([N(c,{value:C(c.value,"@","@"+a)})],i);case n:if(c.length)return D(u=c.props,(function(n){switch(z(n,i=/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":P(N(c,{props:[C(n,/:(read-\w+)/,":"+r+"$1")]}));P(N(c,{props:[n]}));x(c,{props:E(u,i)});break;case"::placeholder":P(N(c,{props:[C(n,/:(plac\w+)/,":"+a+"input-$1")]}));P(N(c,{props:[C(n,/:(plac\w+)/,":"+r+"$1")]}));P(N(c,{props:[C(n,/:(plac\w+)/,e+"input-$1")]}));P(N(c,{props:[n]}));x(c,{props:E(u,i)});break}return ""}))}}

    const SEED$1 = 5381;
    // When we have separate strings it's useful to run a progressive
    // version of djb2 where we pretend that we're still looping over
    // the same string
    const phash = (h, x) => {
        let i = x.length;
        while (i) {
            h = (h * 33) ^ x.charCodeAt(--i);
        }
        return h;
    };
    // This is a djb2 hashing function
    const hash = (x) => {
        return phash(SEED$1, x);
    };

    const AMP_REGEX = /&/g;
    /**
     * Check if a quote at position i is escaped. A quote is escaped when preceded
     * by an ODD number of backslashes (\", \\\", etc.). An even number means the
     * backslashes themselves are escaped and the quote is real (\\", \\\\", etc.).
     */
    function isEscaped(css, i) {
        let backslashes = 0;
        while (--i >= 0 && css.charCodeAt(i) === BACKSLASH)
            backslashes++;
        return (backslashes & 1) === 1;
    }
    /**
     * Unified CSS preprocessor: strips JS-style line comments (//) and validates
     * brace balance in a single pass. Handles strings, parenthesized expressions
     * (any function call), and block comments with one shared state machine.
     *
     * Fast paths:
     *   - No // and no } → return unchanged (zero work)
     *   - No // but has } → brace-only validation (lightweight single pass)
     *   - Has // → full unified pass (strip comments + count braces simultaneously)
     */
    function preprocessCSS(css) {
        const hasLineComments = css.indexOf('//') !== -1;
        const hasCloseBrace = css.indexOf('}') !== -1;
        if (!hasLineComments && !hasCloseBrace)
            return css;
        if (!hasLineComments)
            return sanitizeBraces(css);
        const len = css.length;
        let out = '';
        let start = 0;
        let i = 0;
        let inString = 0;
        let parenDepth = 0;
        let braceDepth = 0;
        let modified = false;
        while (i < len) {
            const code = css.charCodeAt(i);
            if ((code === DOUBLE_QUOTE || code === SINGLE_QUOTE) && !isEscaped(css, i)) {
                if (inString === 0) {
                    inString = code;
                }
                else if (inString === code) {
                    inString = 0;
                }
                i++;
                continue;
            }
            if (inString !== 0) {
                i++;
                continue;
            }
            if (code === SLASH && i + 1 < len && css.charCodeAt(i + 1) === ASTERISK) {
                i += 2;
                while (i + 1 < len && !(css.charCodeAt(i) === ASTERISK && css.charCodeAt(i + 1) === SLASH)) {
                    i++;
                }
                i += 2;
                continue;
            }
            if (code === OPEN_PAREN) {
                parenDepth++;
                i++;
                continue;
            }
            if (code === CLOSE_PAREN) {
                if (parenDepth > 0)
                    parenDepth--;
                i++;
                continue;
            }
            // Inside parentheses (any function call), skip comment/brace detection
            // so that url(https://...), image-set(), etc. are preserved
            if (parenDepth > 0) {
                i++;
                continue;
            }
            if (code === ASTERISK && i + 1 < len && css.charCodeAt(i + 1) === SLASH) {
                out += css.substring(start, i);
                i += 2;
                start = i;
                modified = true;
                continue;
            }
            if (code === SLASH && i + 1 < len && css.charCodeAt(i + 1) === SLASH) {
                out += css.substring(start, i);
                while (i < len && css.charCodeAt(i) !== NEWLINE) {
                    i++;
                }
                start = i;
                modified = true;
                continue;
            }
            if (code === OPEN_BRACE) {
                braceDepth++;
            }
            else if (code === CLOSE_BRACE) {
                braceDepth--;
            }
            i++;
        }
        if (!modified) {
            if (braceDepth === 0)
                return css;
            return sanitizeBraces(css);
        }
        if (start < len)
            out += css.substring(start);
        if (braceDepth === 0)
            return out;
        return sanitizeBraces(out);
    }
    /**
     * Removes declarations with unbalanced braces from CSS.
     * Only called when preprocessCSS detects brace imbalance.
     */
    function sanitizeBraces(css) {
        const len = css.length;
        let result = '';
        let declStart = 0;
        let braceDepth = 0;
        let inString = 0;
        let inComment = false;
        let imbalanced = false;
        for (let i = 0; i < len; i++) {
            const code = css.charCodeAt(i);
            if (inString === 0 && !inComment && code === SLASH && css.charCodeAt(i + 1) === ASTERISK) {
                inComment = true;
                i++;
                continue;
            }
            if (inComment) {
                if (code === ASTERISK && css.charCodeAt(i + 1) === SLASH) {
                    inComment = false;
                    i++;
                }
                continue;
            }
            if ((code === DOUBLE_QUOTE || code === SINGLE_QUOTE) && !isEscaped(css, i)) {
                if (inString === 0) {
                    inString = code;
                }
                else if (inString === code) {
                    inString = 0;
                }
                continue;
            }
            if (inString !== 0)
                continue;
            if (code === OPEN_BRACE) {
                braceDepth++;
            }
            else if (code === CLOSE_BRACE) {
                braceDepth--;
                if (braceDepth < 0) {
                    imbalanced = true;
                    let skipEnd = i + 1;
                    while (skipEnd < len) {
                        const skipCode = css.charCodeAt(skipEnd);
                        if (skipCode === SEMICOLON || skipCode === NEWLINE)
                            break;
                        skipEnd++;
                    }
                    if (skipEnd < len && css.charCodeAt(skipEnd) === SEMICOLON)
                        skipEnd++;
                    braceDepth = 0;
                    i = skipEnd - 1;
                    declStart = skipEnd;
                    continue;
                }
                if (braceDepth === 0) {
                    result += css.substring(declStart, i + 1);
                    declStart = i + 1;
                }
            }
            else if (code === SEMICOLON && braceDepth === 0) {
                result += css.substring(declStart, i + 1);
                declStart = i + 1;
            }
        }
        if (!imbalanced && braceDepth === 0 && inString === 0)
            return css;
        if (declStart < len && braceDepth === 0 && inString === 0) {
            result += css.substring(declStart);
        }
        return result;
    }
    /**
     * Takes an element and recurses through it's rules added the namespace to the start of each selector.
     * Takes into account media queries by recursing through child rules if they are present.
     */
    function recursivelySetNamespace(compiled, namespace) {
        // Stylis AST can share `props` arrays between a top-level rule and a nested
        // copy of the same rule inside @media, so we must allocate a replacement
        // array rather than mutating in place. Hoist the concat operands to save
        // a per-rule/per-prop string alloc.
        const prefix = namespace + ' ';
        const commaReplace = ',' + prefix;
        for (let i = 0; i < compiled.length; i++) {
            const rule = compiled[i];
            if (rule.type === 'rule') {
                rule.value = (prefix + rule.value).replaceAll(',', commaReplace);
                const props = rule.props;
                const newProps = [];
                for (let j = 0; j < props.length; j++) {
                    newProps[j] = prefix + props[j];
                }
                rule.props = newProps;
            }
            if (Array.isArray(rule.children) && rule.type !== '@keyframes') {
                recursivelySetNamespace(rule.children, namespace);
            }
        }
        return compiled;
    }
    function createStylisInstance({ options = EMPTY_OBJECT, plugins = EMPTY_ARRAY, } = EMPTY_OBJECT) {
        let _componentId;
        let _selector;
        let _selectorRegexp;
        const selfReferenceReplacer = (match, offset, string) => {
            if (
            /**
             * We only want to refer to the static class directly if the selector is part of a
             * self-reference selector `& + & { color: red; }`
             */
            string.startsWith(_selector) &&
                string.endsWith(_selector) &&
                string.replaceAll(_selector, '').length > 0) {
                return `.${_componentId}`;
            }
            return match;
        };
        /**
         * When writing a style like
         *
         * & + & {
         *   color: red;
         * }
         *
         * The second ampersand should be a reference to the static component class. stylis
         * has no knowledge of static class so we have to intelligently replace the base selector.
         *
         * https://github.com/thysultan/stylis.js/tree/v4.0.2#abstract-syntax-structure
         */
        const selfReferenceReplacementPlugin = element => {
            if (element.type === n && element.value.includes('&')) {
                // Lazy RegExp creation: only allocate when self-reference pattern is actually used
                if (!_selectorRegexp) {
                    _selectorRegexp = new RegExp(`\\${_selector}\\b`, 'g');
                }
                element.props[0] = element.props[0]
                    // catch any hanging references that stylis missed
                    .replace(AMP_REGEX, _selector)
                    .replace(_selectorRegexp, selfReferenceReplacer);
            }
        };
        const middlewares = plugins.slice();
        middlewares.push(selfReferenceReplacementPlugin);
        /**
         * Enables automatic vendor-prefixing for styles.
         */
        if (options.prefix) {
            middlewares.push(de);
        }
        middlewares.push(be);
        // Pre-build the middleware chain once to avoid allocating closures,
        // arrays, and middleware wrappers on every stringifyRules call.
        // Safe because JS is single-threaded and _stack is consumed before next call.
        let _stack = [];
        const _middleware = he(middlewares.concat(we(value => _stack.push(value))));
        const stringifyRules = (css, selector = '', 
        /**
         * This "prefix" referes to a _selector_ prefix.
         */
        prefix = '', componentId = '&') => {
            // stylis has no concept of state to be passed to plugins
            // but since JS is single-threaded, we can rely on that to ensure
            // these properties stay in sync with the current stylis run
            _componentId = componentId;
            _selector = selector;
            _selectorRegexp = undefined; // Reset for lazy creation per call
            const flatCSS = preprocessCSS(css);
            let compiled = ue(prefix || selector ? prefix + ' ' + selector + ' { ' + flatCSS + ' }' : flatCSS);
            if (options.namespace) {
                compiled = recursivelySetNamespace(compiled, options.namespace);
            }
            _stack = [];
            ve(compiled, _middleware);
            return _stack;
        };
        // Hash includes plugins + options so different stylis configs produce
        // different class names and cache keys.
        const o = options;
        let h = SEED$1;
        for (let i = 0; i < plugins.length; i++) {
            if (!plugins[i].name)
                throwStyledComponentsError(15);
            h = phash(h, plugins[i].name);
        }
        if (o === null || o === void 0 ? void 0 : o.namespace)
            h = phash(h, o.namespace);
        if (o === null || o === void 0 ? void 0 : o.prefix)
            h = phash(h, 'p');
        stringifyRules.hash = h !== SEED$1 ? h.toString() : '';
        return stringifyRules;
    }

    const mainSheet = new StyleSheet();
    const mainStylis = createStylisInstance();
    const defaultContextValue = {
        shouldForwardProp: undefined,
        styleSheet: mainSheet,
        stylis: mainStylis,
        stylisPlugins: undefined,
    };
    // Create context only if createContext is available, otherwise create a fallback
    const StyleSheetContext = React.createContext(defaultContextValue)
        ;
    const StyleSheetConsumer = StyleSheetContext.Consumer;
    function useStyleSheetContext() {
        return React.useContext(StyleSheetContext);
    }
    /** Configure style injection for descendant styled components (target element, stylis plugins, prop forwarding). */
    function StyleSheetManager(props) {
        var _c;
        const parentContext = useStyleSheetContext();
        const { styleSheet } = parentContext;
        const resolvedStyleSheet = React.useMemo(() => {
            let sheet = styleSheet;
            if (props.sheet) {
                sheet = props.sheet;
            }
            else if (props.target) {
                sheet = sheet.reconstructWithOptions(props.nonce !== undefined
                    ? { target: props.target, nonce: props.nonce }
                    : { target: props.target }, false);
            }
            else if (props.nonce !== undefined) {
                sheet = sheet.reconstructWithOptions({ nonce: props.nonce });
            }
            if (props.disableCSSOMInjection) {
                sheet = sheet.reconstructWithOptions({ useCSSOMInjection: false });
            }
            return sheet;
        }, [props.disableCSSOMInjection, props.nonce, props.sheet, props.target, styleSheet]);
        // Inherit parent stylis when no stylis-related props are provided.
        // When any stylis option (namespace, vendorPrefixes) changes, create a new
        // instance but still inherit plugins from the parent if stylisPlugins is omitted.
        // An explicit empty array disables inherited plugins.
        const stylis = React.useMemo(() => {
            var _a;
            return props.stylisPlugins === undefined &&
                props.namespace === undefined &&
                props.enableVendorPrefixes === undefined
                ? parentContext.stylis
                : createStylisInstance({
                    options: { namespace: props.namespace, prefix: props.enableVendorPrefixes },
                    plugins: (_a = props.stylisPlugins) !== null && _a !== void 0 ? _a : parentContext.stylisPlugins,
                });
        }, [
            props.enableVendorPrefixes,
            props.namespace,
            props.stylisPlugins,
            parentContext.stylis,
            parentContext.stylisPlugins,
        ]);
        // Inherit parent shouldForwardProp when not provided.
        const shouldForwardProp = 'shouldForwardProp' in props ? props.shouldForwardProp : parentContext.shouldForwardProp;
        // Resolve which plugins to propagate: own > parent > none
        const resolvedPlugins = (_c = props.stylisPlugins) !== null && _c !== void 0 ? _c : parentContext.stylisPlugins;
        const styleSheetContextValue = React.useMemo(() => ({
            shouldForwardProp,
            styleSheet: resolvedStyleSheet,
            stylis,
            stylisPlugins: resolvedPlugins,
        }), [shouldForwardProp, resolvedStyleSheet, stylis, resolvedPlugins]);
        return (React.createElement(StyleSheetContext.Provider, { value: styleSheetContextValue }, props.children));
    }

    // Create context only if createContext is available, otherwise create a fallback
    const ThemeContext = React.createContext(undefined)
        ;
    const ThemeConsumer = ThemeContext.Consumer;
    function mergeTheme(theme, outerTheme) {
        if (!theme) {
            throw throwStyledComponentsError(14);
        }
        if (isFunction(theme)) {
            const themeFn = theme;
            const mergedTheme = themeFn(outerTheme);
            if ((mergedTheme === null || Array.isArray(mergedTheme) || typeof mergedTheme !== 'object')) {
                throw throwStyledComponentsError(7);
            }
            return mergedTheme;
        }
        if (Array.isArray(theme) || typeof theme !== 'object') {
            throw throwStyledComponentsError(8);
        }
        return outerTheme ? Object.assign(Object.assign({}, outerTheme), theme) : theme;
    }
    /**
     * Returns the current theme (as provided by the closest ancestor `ThemeProvider`.)
     *
     * If no `ThemeProvider` is found, the function will error. If you need access to the theme in an
     * uncertain composition scenario, `React.useContext(ThemeContext)` will not emit an error if there
     * is no `ThemeProvider` ancestor.
     */
    function useTheme() {
        // Skip useContext if we're in an RSC environment without context support
        const theme = React.useContext(ThemeContext) ;
        if (!theme) {
            throw throwStyledComponentsError(18);
        }
        return theme;
    }
    /**
     * Provide a theme to an entire react component tree via context
     */
    function ThemeProvider(props) {
        const outerTheme = React.useContext(ThemeContext);
        const themeContext = React.useMemo(() => mergeTheme(props.theme, outerTheme), [props.theme, outerTheme]);
        if (!props.children) {
            return null;
        }
        return React.createElement(ThemeContext.Provider, { value: themeContext }, props.children);
    }

    const invalidHookCallRe = /invalid hook call/i;
    const seen = new Set();
    const checkDynamicCreation = (displayName, componentId) => {
        {
            const parsedIdString = componentId ? ` with the id of "${componentId}"` : '';
            const message = `The component ${displayName}${parsedIdString} has been created dynamically.\n` +
                "You may see this warning because you've called styled inside another component.\n" +
                'To resolve this only create new StyledComponents outside of any render method and function component.\n' +
                'See https://styled-components.com/docs/basics#define-styled-components-outside-of-the-render-method for more info.\n';
            // If a hook is called outside of a component:
            // React 17 and earlier throw an error
            // React 18 and above use console.error
            const originalConsoleError = console.error;
            try {
                let didNotCallInvalidHook = true;
                console.error = (consoleErrorMessage, ...consoleErrorArgs) => {
                    // The error here is expected, since we're expecting anything that uses `checkDynamicCreation` to
                    // be called outside of a React component.
                    if (invalidHookCallRe.test(consoleErrorMessage)) {
                        didNotCallInvalidHook = false;
                        // This shouldn't happen, but resets `warningSeen` if we had this error happen intermittently
                        seen.delete(message);
                    }
                    else {
                        originalConsoleError(consoleErrorMessage, ...consoleErrorArgs);
                    }
                };
                // We purposefully call a hook outside of a component and expect it to throw
                // If it doesn't, then we're inside another component.
                // Use useState instead of useRef to avoid importing useRef
                if (typeof React.useState === 'function') {
                    React.useState(null);
                }
                if (didNotCallInvalidHook && !seen.has(message)) {
                    console.warn(message);
                    seen.add(message);
                }
            }
            catch (error) {
                // The error here is expected, since we're expecting anything that uses `checkDynamicCreation` to
                // be called outside of a React component.
                if (invalidHookCallRe.test(error.message)) {
                    // This shouldn't happen, but resets `warningSeen` if we had this error happen intermittently
                    seen.delete(message);
                }
            }
            finally {
                console.error = originalConsoleError;
            }
        }
    };

    function determineTheme(props, providedTheme, defaultProps = EMPTY_OBJECT) {
        return (props.theme !== defaultProps.theme && props.theme) || providedTheme || defaultProps.theme;
    }

    const AD_REPLACER_R = /(a)(d)/gi;
    /* This is the "capacity" of our alphabet i.e. 2x26 for all letters plus their capitalised
     * counterparts */
    const charsLength = 52;
    /* start at 75 for 'a' until 'z' (25) and then start at 65 for capitalised letters */
    const getAlphabeticChar = (code) => String.fromCharCode(code + (code > 25 ? 39 : 97));
    /* input a number, usually a hash and convert it to base-52 */
    function generateAlphabeticName(code) {
        let name = '';
        let x;
        /* get a char and divide by alphabet-length */
        for (x = Math.abs(code); x > charsLength; x = (x / charsLength) | 0) {
            name = getAlphabeticChar(x % charsLength) + name;
        }
        return (getAlphabeticChar(x % charsLength) + name).replace(AD_REPLACER_R, '$1-$2');
    }

    function generateComponentId(str) {
        return generateAlphabeticName(hash(str) >>> 0);
    }

    function interleave(strings, interpolations) {
        const result = [strings[0]];
        for (let i = 0, len = interpolations.length; i < len; i += 1) {
            result.push(interpolations[i], strings[i + 1]);
        }
        return result;
    }

    const addTag = (arg) => {
        cssTagged.add(arg);
        return arg;
    };
    function css(styles, ...interpolations) {
        if (isFunction(styles) || isPlainObject(styles)) {
            const styleFunctionOrObject = styles;
            return addTag(flatten(interleave(EMPTY_ARRAY, [
                styleFunctionOrObject,
                ...interpolations,
            ])));
        }
        const styleStringArray = styles;
        if (interpolations.length === 0 &&
            styleStringArray.length === 1 &&
            typeof styleStringArray[0] === 'string') {
            return flatten(styleStringArray);
        }
        return addTag(flatten(interleave(styleStringArray, interpolations)));
    }

    /**
     * Create a component that injects global CSS when mounted. Supports theming and dynamic props.
     *
     * ```tsx
     * const GlobalStyle = createGlobalStyle`
     *   body { margin: 0; font-family: system-ui; }
     * `;
     * // Render <GlobalStyle /> at the root of your app
     * ```
     */
    function createGlobalStyle(strings, ...interpolations) {
        const rules = css(strings, ...interpolations);
        const styledComponentId = `sc-global-${generateComponentId(JSON.stringify(rules))}`;
        const globalStyle = new GlobalStyle(rules, styledComponentId);
        {
            checkDynamicCreation(styledComponentId);
        }
        const GlobalStyleComponent = props => {
            const ssc = useStyleSheetContext();
            const theme = React.useContext(ThemeContext) ;
            // Each mount needs a unique instance ID for the shared-group instanceRules cache.
            // false is a build-time constant: the dead branch is entirely eliminated,
            // so React never sees a conditional hook call.
            // Server bundle: direct allocation (one-shot renders, no stability needed).
            // Browser bundle: useRef for stable ID across re-renders + useLayoutEffect cleanup.
            let instance;
            {
                const instanceRef = React.useRef(null);
                if (instanceRef.current === null) {
                    instanceRef.current = ssc.styleSheet.allocateGSInstance(styledComponentId);
                }
                instance = instanceRef.current;
            }
            if (// @ts-expect-error invariant check
                React.Children.count(props.children)) {
                console.warn(`The global style component ${styledComponentId} was given child JSX. createGlobalStyle does not render children.`);
            }
            if (rules.some(rule => typeof rule === 'string' && rule.indexOf('@import') !== -1)) {
                console.warn(`Please do not use @import CSS syntax in createGlobalStyle at this time, as the CSSOM APIs we use in production do not handle it well. Instead, we recommend using a library such as react-helmet to inject a typical <link> meta tag to the stylesheet, or simply embedding it manually in your index.html <head> section for a simpler app.`);
            }
            // Render styles during component execution for RSC or explicit ServerStyleSheet.
            // Gate on IS_RSC or styleSheet.server (runtime flag from ServerStyleSheet),
            // NOT on false alone. The server build sets false=true and eliminates
            // useLayoutEffect, so if we rendered here without cleanup, styles would
            // accumulate unboundedly in jsdom test environments (O(n²) regression).
            // On a real server without ServerStyleSheet, VirtualTag is used and styles are
            // discarded anyway, so skipping this path has no functional impact.
            // Turbopack resolves the browser entry for SSR, so false is false there;
            // styleSheet.server handles that case at runtime.
            if (ssc.styleSheet.server) {
                renderStyles(instance, props, ssc.styleSheet, theme, ssc.stylis);
            }
            // Client-side lifecycle: render styles in effect and clean up on unmount.
            // false and IS_RSC are build/module-level constants, so this doesn't violate rules of hooks.
            {
                // Split into two effects so cleanup (removeStyles → full rebuildGroup) only
                // fires on actual unmount or sheet/globalStyle swap -- NOT on every prop change.
                //
                // For dynamic globals, `props` is a new reference every render, so the render
                // effect re-runs each render. If cleanup ran on every re-run, each render would
                // do two full rebuildGroups (delete + reinsert all instances), which dominates
                // CPU on apps with frequent parent re-renders (issue #5730). Splitting lets
                // renderStyles' rulesEqual fast-path skip rebuildGroup when CSS is unchanged.
                //
                // globalStyle is included in render deps so HMR-induced module re-evaluation
                // (which creates a new GlobalStyle instance) triggers effect re-run.
                // For static rules, renderStyles exits early after the first injection
                // (via hasNameForId check), so the extra dep is effectively free at runtime.
                // eslint-disable-next-line react-hooks/exhaustive-deps
                const renderDeps = globalStyle.isStatic
                    ? [instance, ssc.styleSheet, globalStyle]
                    : [instance, props, ssc.styleSheet, theme, ssc.stylis, globalStyle];
                const prevGlobalStyleRef = React.useRef(globalStyle);
                React.useLayoutEffect(() => {
                    if (!ssc.styleSheet.server) {
                        // HMR creates a new globalStyle instance but the componentId stays stable
                        // (SWC plugin assigns by file location), so stale hasNameForId hits skip injection.
                        if (prevGlobalStyleRef.current !== globalStyle) {
                            ssc.styleSheet.clearRules(styledComponentId);
                            prevGlobalStyleRef.current = globalStyle;
                        }
                        renderStyles(instance, props, ssc.styleSheet, theme, ssc.stylis);
                    }
                }, renderDeps);
                // Cleanup-only effect: fires on unmount, sheet swap, or HMR globalStyle swap.
                // Closure captures the specific globalStyle/sheet that owned this instance's
                // rules so HMR cleanup targets the prior module's state.
                React.useLayoutEffect(() => {
                    return () => {
                        if (!ssc.styleSheet.server) {
                            globalStyle.removeStyles(instance, ssc.styleSheet);
                        }
                    };
                }, [instance, ssc.styleSheet, globalStyle]);
            }
            // Clean up server instance cache - no useLayoutEffect cleanup runs on the
            // server, so instanceRules would grow unboundedly across SSR requests.
            if (ssc.styleSheet.server) {
                globalStyle.instanceRules.delete(instance);
            }
            return null;
        };
        function renderStyles(instance, props, styleSheet, theme, stylis) {
            if (globalStyle.isStatic) {
                globalStyle.renderStyles(instance, STATIC_EXECUTION_CONTEXT, styleSheet, stylis);
            }
            else {
                const context = Object.assign(Object.assign({}, props), { theme: determineTheme(props, theme, GlobalStyleComponent.defaultProps) });
                globalStyle.renderStyles(instance, context, styleSheet, stylis);
            }
        }
        return React.memo(GlobalStyleComponent);
    }

    /** Shared recursive traversal - calls `leafFn` for each leaf, recurses for objects. */
    function walkTheme(obj, varPrefix, result, leafFn, path) {
        for (const key in obj) {
            const val = obj[key];
            const fullPath = path ? path + '-' + key : key;
            if (typeof val === 'object' && val !== null) {
                const nested = {};
                walkTheme(val, varPrefix, nested, leafFn, fullPath);
                result[key] = nested;
            }
            else {
                result[key] = leafFn(fullPath, val, key);
            }
        }
    }
    /** Build bare CSS custom property names: `--prefix-a-b` */
    function buildVarNames(obj, varPrefix) {
        const result = {};
        walkTheme(obj, varPrefix, result, fullPath => '--' + varPrefix + fullPath);
        return result;
    }
    /** Build `var(--prefix-a-b, fallback)` references with dev-mode parenthesis validation */
    function buildVarRefs(obj, varPrefix) {
        const result = {};
        walkTheme(obj, varPrefix, result, (fullPath, val) => {
            {
                const str = String(val);
                let depth = 0;
                for (let i = 0; i < str.length; i++) {
                    if (str.charCodeAt(i) === 40)
                        depth++;
                    else if (str.charCodeAt(i) === 41)
                        depth--;
                    if (depth < 0)
                        break;
                }
                if (depth !== 0) {
                    console.warn(`createTheme: value "${str}" at "${fullPath}" contains unbalanced parentheses and may break the var() fallback`);
                }
            }
            return 'var(--' + varPrefix + fullPath + ', ' + val + ')';
        });
        return result;
    }
    /** Read computed CSS variable values from the DOM */
    function resolveVars(obj, varPrefix, styles) {
        const result = {};
        walkTheme(obj, varPrefix, result, (fullPath, val) => {
            const resolved = styles.getPropertyValue('--' + varPrefix + fullPath).trim();
            return resolved || val;
        });
        return result;
    }
    /**
     * Emit CSS var declarations by walking `shape` for structure and reading
     * values from `theme`. This avoids hardcoded skip lists - only keys
     * present in the original theme shape are traversed.
     */
    function emitVarDeclarations(shape, theme, varPrefix, path) {
        let css = '';
        for (const key in shape) {
            const shapeVal = shape[key];
            const themeVal = theme[key];
            const fullPath = path ? path + '-' + key : key;
            if (typeof shapeVal === 'object' && shapeVal !== null) {
                if (typeof themeVal === 'object' && themeVal !== null) {
                    css += emitVarDeclarations(shapeVal, themeVal, varPrefix, fullPath);
                }
            }
            else if (themeVal !== undefined && typeof themeVal !== 'function') {
                css += '--' + varPrefix + fullPath + ':' + themeVal + ';';
            }
        }
        return css;
    }
    /**
     * Create a theme backed by CSS custom properties, bridging `ThemeProvider` and CSS variables.
     *
     * Returns an object with the same shape as the input theme, but every leaf value
     * is a `var(--prefix-*, fallback)` CSS string. Use these in styled component
     * templates - they work in both client and RSC contexts.
     *
     * Mount the returned `GlobalStyle` component inside your `ThemeProvider` to emit
     * the CSS variables. When the theme changes (e.g. light → dark), the variables
     * update automatically.
     *
     * @example
     * ```tsx
     * const theme = createTheme({
     *   colors: { primary: '#0070f3', text: '#111' },
     * });
     *
     * // Root layout (client):
     * <ThemeProvider theme={themes[preset]}>
     *   <theme.GlobalStyle />
     *   {children}
     * </ThemeProvider>
     *
     * // Any RSC file:
     * const Card = styled.div`
     *   color: ${theme.colors.primary};
     *   // → "var(--sc-colors-primary, #0070f3)"
     * `;
     * ```
     */
    function createTheme(defaultTheme, options) {
        var _a, _b;
        const pfx = ((_a = options === null || options === void 0 ? void 0 : options.prefix) !== null && _a !== void 0 ? _a : 'sc') + '-';
        const sel = (_b = options === null || options === void 0 ? void 0 : options.selector) !== null && _b !== void 0 ? _b : ':root';
        const varNames = buildVarNames(defaultTheme, pfx);
        const varRefs = buildVarRefs(defaultTheme, pfx);
        const GlobalStyle = createGlobalStyle `
    ${sel} {
      ${(p) => emitVarDeclarations(defaultTheme, p.theme, pfx)}
    }
  `;
        return Object.assign(varRefs, {
            GlobalStyle,
            raw: defaultTheme,
            vars: varNames,
            resolve(el) {
                if (!IS_BROWSER) {
                    throw new Error('createTheme.resolve() is client-only');
                }
                const target = el !== null && el !== void 0 ? el : document.documentElement;
                return resolveVars(defaultTheme, pfx, getComputedStyle(target));
            },
        });
    }

    var _a;
    class Keyframes {
        constructor(name, rules) {
            this[_a] = true;
            this.inject = (styleSheet, stylisInstance = mainStylis) => {
                const resolvedName = this.getName(stylisInstance);
                if (!styleSheet.hasNameForId(this.id, resolvedName)) {
                    {
                        const compiled = stylisInstance(this.rules, resolvedName, '@keyframes');
                        styleSheet.insertRules(this.id, resolvedName, compiled);
                    }
                }
            };
            this.name = name;
            this.id = KEYFRAMES_ID_PREFIX + name;
            this.rules = rules;
            // Eagerly register the group so keyframes defined before components
            // get a lower group ID and appear before them in the stylesheet.
            // Uses getGroupForId directly (not StyleSheet.registerId) because
            // GroupIDAllocator is pure JS - safe for native builds.
            getGroupForId(this.id);
            setToString(this, () => {
                throw throwStyledComponentsError(12, String(this.name));
            });
        }
        getName(stylisInstance = mainStylis) {
            return stylisInstance.hash
                ? this.name + generateAlphabeticName(+stylisInstance.hash >>> 0)
                : this.name;
        }
    }
    _a = KEYFRAMES_SYMBOL;

    /**
     * Define a CSS `@keyframes` animation with an automatically scoped name.
     *
     * ```tsx
     * const rotate = keyframes`
     *   from { transform: rotate(0deg); }
     *   to { transform: rotate(360deg); }
     * `;
     * const Spinner = styled.div`animation: ${rotate} 1s linear infinite;`;
     * ```
     */
    function keyframes(strings, ...interpolations) {
        /* Warning if you've used keyframes on React Native */
        if (typeof navigator !== 'undefined' &&
            navigator.product === 'ReactNative') {
            console.warn('`keyframes` cannot be used on ReactNative, only on the web. To do animation in ReactNative please use Animated.');
        }
        const rules = joinStringArray(css(strings, ...interpolations));
        const name = generateComponentId(rules);
        return new Keyframes(name, rules);
    }

    // copied from react-is
    const REACT_MEMO_TYPE = Symbol.for('react.memo');
    const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
    /**
     * Adapted from hoist-non-react-statics to avoid the react-is dependency.
     */
    const REACT_STATICS = {
        contextType: true,
        defaultProps: true,
        displayName: true,
        getDerivedStateFromError: true,
        getDerivedStateFromProps: true,
        propTypes: true,
        type: true,
    };
    const KNOWN_STATICS = {
        name: true,
        length: true,
        prototype: true,
        caller: true,
        callee: true,
        arguments: true,
        arity: true,
    };
    const FORWARD_REF_STATICS = {
        $$typeof: true,
        render: true,
        defaultProps: true,
        displayName: true,
        propTypes: true,
    };
    const MEMO_STATICS = {
        $$typeof: true,
        compare: true,
        defaultProps: true,
        displayName: true,
        propTypes: true,
        type: true,
    };
    const TYPE_STATICS = {
        [REACT_FORWARD_REF_TYPE]: FORWARD_REF_STATICS,
        [REACT_MEMO_TYPE]: MEMO_STATICS,
    };
    // adapted from react-is
    function isMemo(object) {
        const $$typeofType = 'type' in object && object.type.$$typeof;
        return $$typeofType === REACT_MEMO_TYPE;
    }
    function getStatics(component) {
        // React v16.11 and below
        if (isMemo(component)) {
            return MEMO_STATICS;
        }
        // React v16.12 and above
        return '$$typeof' in component
            ? TYPE_STATICS[component['$$typeof']]
            : REACT_STATICS;
    }
    const defineProperty = Object.defineProperty;
    const getOwnPropertyNames = Object.getOwnPropertyNames;
    const getOwnPropertySymbols = Object.getOwnPropertySymbols;
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const getPrototypeOf = Object.getPrototypeOf;
    const objectPrototype = Object.prototype;
    function hoistNonReactStatics(targetComponent, sourceComponent, excludelist) {
        if (typeof sourceComponent !== 'string') {
            // don't hoist over string (html) components
            const inheritedComponent = getPrototypeOf(sourceComponent);
            if (inheritedComponent && inheritedComponent !== objectPrototype) {
                hoistNonReactStatics(targetComponent, inheritedComponent, excludelist);
            }
            const keys = getOwnPropertyNames(sourceComponent).concat(getOwnPropertySymbols(sourceComponent));
            const targetStatics = getStatics(targetComponent);
            const sourceStatics = getStatics(sourceComponent);
            for (let i = 0; i < keys.length; ++i) {
                const key = keys[i];
                if (!(key in KNOWN_STATICS) &&
                    !(excludelist && excludelist[key]) &&
                    !(sourceStatics && key in sourceStatics) &&
                    !(targetStatics && key in targetStatics)) {
                    const descriptor = getOwnPropertyDescriptor(sourceComponent, key);
                    try {
                        // Avoid failures from read-only properties
                        defineProperty(targetComponent, key, descriptor);
                    }
                    catch (e) {
                        /* ignore */
                    }
                }
            }
        }
        return targetComponent;
    }

    /** Higher-order component that injects the current theme as a prop. Prefer `useTheme` in function components. */
    function withTheme(Component) {
        const WithTheme = React.forwardRef((props, ref) => {
            const theme = React.useContext(ThemeContext) ;
            const themeProp = determineTheme(props, theme, Component.defaultProps);
            if (themeProp === undefined) {
                console.warn(`[withTheme] You are not using a ThemeProvider nor passing a theme prop or a theme in defaultProps in component class "${getComponentName(Component)}"`);
            }
            return React.createElement(Component, Object.assign(Object.assign({}, props), { theme: themeProp, ref }));
        });
        WithTheme.displayName = `WithTheme(${getComponentName(Component)})`;
        return hoistNonReactStatics(WithTheme, Component);
    }

    class ServerStyleSheet {
        constructor({ nonce } = {}) {
            this._emitSheetCSS = () => {
                const css = this.instance.toString();
                if (!css)
                    return '';
                const nonce = this.instance.options.nonce || getNonce();
                const attrs = [
                    nonce && `nonce="${nonce}"`,
                    `${SC_ATTR}="true"`,
                    `${SC_ATTR_VERSION}="${SC_VERSION}"`,
                ];
                const htmlAttr = joinStringArray(attrs.filter(Boolean), ' ');
                return `<style ${htmlAttr}>${css}</style>`;
            };
            this.getStyleTags = () => {
                if (this.sealed) {
                    throw throwStyledComponentsError(2);
                }
                return this._emitSheetCSS();
            };
            this.getStyleElement = () => {
                if (this.sealed) {
                    throw throwStyledComponentsError(2);
                }
                const css = this.instance.toString();
                if (!css)
                    return [];
                const props = {
                    [SC_ATTR]: '',
                    [SC_ATTR_VERSION]: SC_VERSION,
                    dangerouslySetInnerHTML: {
                        __html: css,
                    },
                };
                const nonce = this.instance.options.nonce || getNonce();
                if (nonce) {
                    props.nonce = nonce;
                }
                // v4 returned an array for this fn, so we'll do the same for v5 for backward compat
                return [React.createElement("style", Object.assign({}, props, { key: "sc-0-0" }))];
            };
            this.seal = () => {
                this.sealed = true;
            };
            this.instance = new StyleSheet({ isServer: true, nonce });
            this.sealed = false;
        }
        collectStyles(children) {
            if (this.sealed) {
                throw throwStyledComponentsError(2);
            }
            return React.createElement(StyleSheetManager, { sheet: this.instance }, children);
        }
        interleaveWithNodeStream(input) {
            {
                throw throwStyledComponentsError(3);
            }
        }
    }

    const __PRIVATE__ = {
        StyleSheet,
        mainSheet,
    };

    /* Import singletons */
    /* Warning if you've imported this file on React Native */
    if (typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative') {
        console.warn(`It looks like you've imported 'styled-components' on React Native.\nPerhaps you're looking to import 'styled-components/native'?\nRead more about this at https://styled-components.com/docs/basics#react-native`);
    }
    const windowGlobalKey = `__sc-${SC_ATTR}__`;
    /* Warning if there are several instances of styled-components */
    if (typeof window !== 'undefined') {
        // @ts-expect-error dynamic key not in window object
        window[windowGlobalKey] || (window[windowGlobalKey] = 0);
        // @ts-expect-error dynamic key not in window object
        if (window[windowGlobalKey] === 1) {
            console.warn(`It looks like there are several instances of 'styled-components' initialized in this application. This may cause dynamic styles to not render properly, errors during the rehydration process, a missing theme prop, and makes your application bigger without good reason.\n\nSee https://styled-components.com/docs/faqs#why-am-i-getting-a-warning-about-several-instances-of-module-on-the-page for more info.`);
        }
        // @ts-expect-error dynamic key not in window object
        window[windowGlobalKey] += 1;
    }

    var secondary = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ServerStyleSheet: ServerStyleSheet,
        StyleSheetConsumer: StyleSheetConsumer,
        StyleSheetContext: StyleSheetContext,
        StyleSheetManager: StyleSheetManager,
        ThemeConsumer: ThemeConsumer,
        ThemeContext: ThemeContext,
        ThemeProvider: ThemeProvider,
        __PRIVATE__: __PRIVATE__,
        createGlobalStyle: createGlobalStyle,
        createTheme: createTheme,
        css: css,
        isStyledComponent: isStyledComponent,
        keyframes: keyframes,
        useTheme: useTheme,
        version: SC_VERSION,
        withTheme: withTheme
    });

    function memoize(fn) {
      var cache = Object.create(null);
      return function (arg) {
        if (cache[arg] === undefined) cache[arg] = fn(arg);
        return cache[arg];
      };
    }

    // eslint-disable-next-line no-undef
    var reactPropsRegex = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|fetchpriority|fetchPriority|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|popover|popoverTarget|popoverTargetAction|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/; // https://esbench.com/bench/5bfee68a4cd7e6009ef61d23

    var isPropValid = /* #__PURE__ */memoize(function (prop) {
      return reactPropsRegex.test(prop) || prop.charCodeAt(0) === 111
      /* o */
      && prop.charCodeAt(1) === 110
      /* n */
      && prop.charCodeAt(2) < 91;
    }
    /* Z+1 */
    );

    const LIMIT = 200;
    var createWarnTooManyClasses = (displayName, componentId) => {
        let generatedClasses = {};
        let warningSeen = false;
        return (className) => {
            if (!warningSeen) {
                generatedClasses[className] = true;
                if (Object.keys(generatedClasses).length >= LIMIT) {
                    // Unable to find latestRule in test environment.
                    const parsedIdString = componentId ? ` with the id of "${componentId}"` : '';
                    console.warn(`Over ${LIMIT} classes were generated for component ${displayName}${parsedIdString}.\n` +
                        'Consider using the attrs method, together with a style object for frequently changed styles.\n' +
                        'Example:\n' +
                        '  const Component = styled.div.attrs(props => ({\n' +
                        '    style: {\n' +
                        '      background: props.background,\n' +
                        '    },\n' +
                        '  }))`width: 100%;`\n\n' +
                        '  <Component />');
                    warningSeen = true;
                    generatedClasses = {};
                }
            }
        };
    };

    // Source: https://www.w3.org/TR/cssom-1/#serialize-an-identifier
    // Control characters and non-letter first symbols are not supported
    const escapeRegex = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g;
    const dashesAtEnds = /(^-|-$)/g;
    function escape(str) {
        return str // Replace all possible CSS selectors
            .replace(escapeRegex, '-') // Remove extraneous hyphens at the start and end
            .replace(dashesAtEnds, '');
    }

    function isTag(target) {
        return (typeof target === 'string' &&
            (target.charAt(0) === target.charAt(0).toLowerCase()
                ));
    }

    function generateDisplayName(target) {
        return isTag(target) ? `styled.${target}` : `Styled(${getComponentName(target)})`;
    }

    function mixinRecursively(target, source, forceMerge = false) {
        /* only merge into POJOs, Arrays, but for top level objects only
         * allow to merge into anything by passing forceMerge = true */
        if (!forceMerge && !isPlainObject(target) && !Array.isArray(target)) {
            return source;
        }
        if (Array.isArray(source)) {
            for (let key = 0; key < source.length; key++) {
                target[key] = mixinRecursively(target[key], source[key]);
            }
        }
        else if (isPlainObject(source)) {
            for (const key in source) {
                target[key] = mixinRecursively(target[key], source[key]);
            }
        }
        return target;
    }
    /**
     * Arrays & POJOs merged recursively, other objects and value types are overridden
     * If target is not a POJO or an Array, it will get source properties injected via shallow merge
     * Source objects applied left to right.  Mutates & returns target.  Similar to lodash merge.
     */
    function mixinDeep(target, ...sources) {
        for (const source of sources) {
            mixinRecursively(target, source, true);
        }
        return target;
    }

    const SEED = hash(SC_VERSION);
    /**
     * Upper bound on dynamicNameCache entries per ComponentStyle instance.
     * Without this cap, components with free-form string interpolations
     * (e.g. `color: ${p => p.$color}` where $color is unbounded user input)
     * leak memory for the lifetime of the component definition. Aligned to
     * the warnTooManyClasses dev threshold so the warning and the eviction
     * share a single source of truth: by the time you start dropping cache
     * entries, the dev warning has already told you why.
     */
    const MAX_DYNAMIC_NAME_CACHE = LIMIT;
    /**
     * ComponentStyle is all the CSS-specific stuff, not the React-specific stuff.
     */
    class ComponentStyle {
        constructor(rules, componentId, baseStyle) {
            this.rules = rules;
            this.componentId = componentId;
            this.baseHash = phash(SEED, componentId);
            this.baseStyle = baseStyle;
            // NOTE: This registers the componentId, which ensures a consistent order
            // for this component's styles compared to others
            StyleSheet.registerId(componentId);
        }
        generateAndInjectStyles(executionContext, styleSheet, stylis) {
            let names = this.baseStyle
                ? this.baseStyle.generateAndInjectStyles(executionContext, styleSheet, stylis)
                : '';
            {
                let css = '';
                for (let i = 0; i < this.rules.length; i++) {
                    const partRule = this.rules[i];
                    if (typeof partRule === 'string') {
                        css += partRule;
                    }
                    else if (partRule) {
                        // Fast path: inline function call for the common case (interpolation
                        // returning a string). Avoids flatten's type dispatch and array alloc.
                        if (isStatelessFunction(partRule)) {
                            const fnResult = partRule(executionContext);
                            if (typeof fnResult === 'string') {
                                css += fnResult;
                            }
                            else if (fnResult !== undefined && fnResult !== null && fnResult !== false) {
                                if (typeof fnResult === 'object' &&
                                    !Array.isArray(fnResult) &&
                                    !isKeyframes(fnResult) &&
                                    !isPlainObject(fnResult)) {
                                    console.error(`${getComponentName(partRule)} is not a styled component and cannot be referred to via component selector. See https://styled-components.com/docs/advanced#referring-to-other-components for more details.`);
                                }
                                css += joinStringArray(flatten(fnResult, executionContext, styleSheet, stylis));
                            }
                        }
                        else {
                            css += joinStringArray(flatten(partRule, executionContext, styleSheet, stylis));
                        }
                    }
                }
                if (css) {
                    // Cache css->name to skip phash+generateName for repeat CSS strings.
                    // The CSS string fully determines the class name for a given component,
                    // so a Map lookup replaces O(cssLen) hashing on cache hit.
                    if (!this.dynamicNameCache)
                        this.dynamicNameCache = new Map();
                    const cacheKey = stylis.hash ? stylis.hash + css : css;
                    let name = this.dynamicNameCache.get(cacheKey);
                    if (!name) {
                        name = generateAlphabeticName(phash(phash(this.baseHash, stylis.hash), css) >>> 0);
                        if (this.dynamicNameCache.size >= MAX_DYNAMIC_NAME_CACHE) {
                            const oldest = this.dynamicNameCache.keys().next().value;
                            if (oldest !== undefined)
                                this.dynamicNameCache.delete(oldest);
                        }
                        this.dynamicNameCache.set(cacheKey, name);
                    }
                    if (!styleSheet.hasNameForId(this.componentId, name)) {
                        {
                            const cssFormatted = stylis(css, '.' + name, undefined, this.componentId);
                            styleSheet.insertRules(this.componentId, name, cssFormatted);
                        }
                    }
                    names = joinStrings(names, name);
                }
            }
            return names;
        }
    }

    const hasOwn = Object.prototype.hasOwnProperty;
    const identifiers = {};
    /* We depend on components having unique IDs */
    function generateId(displayName, parentComponentId) {
        const name = typeof displayName !== 'string' ? 'sc' : escape(displayName);
        // Ensure that no displayName can lead to duplicate componentIds
        identifiers[name] = (identifiers[name] || 0) + 1;
        const componentId = name +
            '-' +
            generateComponentId(
            // SC_VERSION gives us isolation between multiple runtimes on the page at once
            // this is improved further with use of the babel plugin "namespace" feature
            SC_VERSION + name + identifiers[name]);
        return parentComponentId ? parentComponentId + '-' + componentId : componentId;
    }
    /**
     * Shallow-compare two context objects using a stored key count to avoid
     * a second iteration pass. Returns true if all own-property values match.
     */
    function shallowEqualContext(prev, next, prevKeyCount) {
        const a = prev;
        const b = next;
        let nextKeyCount = 0;
        for (const key in b) {
            if (hasOwn.call(b, key)) {
                nextKeyCount++;
                if (a[key] !== b[key])
                    return false;
            }
        }
        return nextKeyCount === prevKeyCount;
    }
    function useInjectedStyle(componentStyle, resolvedAttrs, styleSheet, stylis) {
        const className = componentStyle.generateAndInjectStyles(resolvedAttrs, styleSheet, stylis);
        if (React.useDebugValue) {
            React.useDebugValue(className);
        }
        return className;
    }
    function resolveContext(attrs, props, theme) {
        const context = Object.assign(Object.assign({}, props), { 
            // unset, add `props.className` back at the end so props always "wins"
            className: undefined, theme });
        const needsCopy = attrs.length > 1;
        for (let i = 0; i < attrs.length; i++) {
            const attrDef = attrs[i];
            const resolvedAttrDef = isFunction(attrDef)
                ? attrDef(needsCopy ? Object.assign({}, context) : context)
                : attrDef;
            for (const key in resolvedAttrDef) {
                if (key === 'className') {
                    context.className = joinStrings(context.className, resolvedAttrDef[key]);
                }
                else if (key === 'style') {
                    context.style = Object.assign(Object.assign({}, context.style), resolvedAttrDef[key]);
                }
                else if (!(key in props && props[key] === undefined)) {
                    // Apply attr value unless the user explicitly passed undefined for this prop,
                    // which signals intent to reset the value.
                    // @ts-expect-error attrs can dynamically add arbitrary properties
                    context[key] = resolvedAttrDef[key];
                }
            }
        }
        if ('className' in props && typeof props.className === 'string') {
            context.className = joinStrings(context.className, props.className);
        }
        return context;
    }
    let seenUnknownProps;
    function buildPropsForElement(context, elementToBeCreated, theme, shouldForwardProp) {
        const propsForElement = {};
        for (const key in context) {
            if (context[key] === undefined) ;
            else if (key[0] === '$' || key === 'as' || (key === 'theme' && context.theme === theme)) ;
            else if (key === 'forwardedAs') {
                propsForElement.as = context.forwardedAs;
            }
            else if (!shouldForwardProp || shouldForwardProp(key, elementToBeCreated)) {
                propsForElement[key] = context[key];
                if (!shouldForwardProp &&
                    "development" === 'development' &&
                    !isPropValid(key) &&
                    !(seenUnknownProps || (seenUnknownProps = new Set())).has(key) &&
                    isTag(elementToBeCreated) &&
                    !elementToBeCreated.includes('-')) {
                    seenUnknownProps.add(key);
                    console.warn(`styled-components: it looks like an unknown prop "${key}" is being sent through to the DOM, which will likely trigger a React console error. If you would like automatic filtering of unknown props, you can opt-into that behavior via \`<StyleSheetManager shouldForwardProp={...}>\` (connect an API like \`@emotion/is-prop-valid\`) or consider using transient props (\`$\` prefix for automatic filtering.)`);
                }
            }
        }
        return propsForElement;
    }
    function useStyledComponentImpl(forwardedComponent, props, forwardedRef) {
        const { attrs: componentAttrs, componentStyle, defaultProps, foldedComponentIds, styledComponentId, target, } = forwardedComponent;
        const contextTheme = React.useContext(ThemeContext) ;
        const ssc = useStyleSheetContext();
        const shouldForwardProp = forwardedComponent.shouldForwardProp || ssc.shouldForwardProp;
        if (React.useDebugValue) {
            React.useDebugValue(styledComponentId);
        }
        // NOTE: the non-hooks version only subscribes to this when !componentStyle.isStatic,
        // but that'd be against the rules-of-hooks. We could be naughty and do it anyway as it
        // should be an immutable value, but behave for now.
        const theme = determineTheme(props, contextTheme, defaultProps) || (EMPTY_OBJECT);
        let context;
        let generatedClassName;
        // Client-only render cache: skip resolveContext and generateAndInjectStyles
        // when props+theme haven't changed. propsForElement is always rebuilt since
        // it's mutated with className/ref after construction.
        // false and IS_RSC are build/module-level constants for dead-code elimination.
        {
            const renderCacheRef = React.useRef(null);
            const prev = renderCacheRef.current;
            if (prev !== null &&
                prev[1] === theme &&
                prev[2] === ssc.styleSheet &&
                prev[3] === ssc.stylis &&
                prev[7] === componentStyle &&
                shallowEqualContext(prev[0], props, prev[4])) {
                context = prev[5];
                generatedClassName = prev[6];
            }
            else {
                context = resolveContext(componentAttrs, props, theme);
                generatedClassName = useInjectedStyle(componentStyle, context, ssc.styleSheet, ssc.stylis);
                let propsKeyCount = 0;
                for (const key in props) {
                    if (hasOwn.call(props, key))
                        propsKeyCount++;
                }
                renderCacheRef.current = [
                    props,
                    theme,
                    ssc.styleSheet,
                    ssc.stylis,
                    propsKeyCount,
                    context,
                    generatedClassName,
                    componentStyle,
                ];
            }
        }
        if (forwardedComponent.warnTooManyClasses) {
            forwardedComponent.warnTooManyClasses(generatedClassName);
        }
        const elementToBeCreated = context.as || target;
        const propsForElement = buildPropsForElement(context, elementToBeCreated, theme, shouldForwardProp);
        let classString = joinStrings(foldedComponentIds, styledComponentId);
        if (generatedClassName) {
            classString += ' ' + generatedClassName;
        }
        if (context.className) {
            classString += ' ' + context.className;
        }
        propsForElement[isTag(elementToBeCreated) && elementToBeCreated.includes('-') ? 'class' : 'className'] = classString;
        if (forwardedRef) {
            propsForElement.ref = forwardedRef;
        }
        const element = React.createElement(elementToBeCreated, propsForElement);
        return element;
    }
    function createStyledComponent(target, options, rules) {
        const isTargetStyledComp = isStyledComponent(target);
        const styledComponentTarget = target;
        const isCompositeComponent = !isTag(target);
        const { attrs = EMPTY_ARRAY, componentId = generateId(options.displayName, options.parentComponentId), displayName = generateDisplayName(target), } = options;
        const styledComponentId = options.displayName && options.componentId
            ? escape(options.displayName) + '-' + options.componentId
            : options.componentId || componentId;
        // fold the underlying StyledComponent attrs up (implicit extend)
        const finalAttrs = isTargetStyledComp && styledComponentTarget.attrs
            ? styledComponentTarget.attrs.concat(attrs).filter(Boolean)
            : attrs;
        let { shouldForwardProp } = options;
        if (isTargetStyledComp && styledComponentTarget.shouldForwardProp) {
            const shouldForwardPropFn = styledComponentTarget.shouldForwardProp;
            if (options.shouldForwardProp) {
                const passedShouldForwardPropFn = options.shouldForwardProp;
                // compose nested shouldForwardProp calls
                shouldForwardProp = (prop, elementToBeCreated) => shouldForwardPropFn(prop, elementToBeCreated) &&
                    passedShouldForwardPropFn(prop, elementToBeCreated);
            }
            else {
                shouldForwardProp = shouldForwardPropFn;
            }
        }
        const componentStyle = new ComponentStyle(rules, styledComponentId, isTargetStyledComp ? styledComponentTarget.componentStyle : undefined);
        function forwardRefRender(props, ref) {
            return useStyledComponentImpl(WrappedStyledComponent, props, ref);
        }
        forwardRefRender.displayName = displayName;
        /**
         * forwardRef creates a new interim component, which we'll take advantage of
         * instead of extending ParentComponent to create _another_ interim class
         */
        let WrappedStyledComponent = React.forwardRef(forwardRefRender);
        WrappedStyledComponent.attrs = finalAttrs;
        WrappedStyledComponent.componentStyle = componentStyle;
        WrappedStyledComponent.displayName = displayName;
        WrappedStyledComponent.shouldForwardProp = shouldForwardProp;
        // this static is used to preserve the cascade of static classes for component selector
        // purposes; this is especially important with usage of the css prop
        WrappedStyledComponent.foldedComponentIds = isTargetStyledComp
            ? joinStrings(styledComponentTarget.foldedComponentIds, styledComponentTarget.styledComponentId)
            : '';
        WrappedStyledComponent.styledComponentId = styledComponentId;
        // fold the underlying StyledComponent target up since we folded the styles
        WrappedStyledComponent.target = isTargetStyledComp ? styledComponentTarget.target : target;
        Object.defineProperty(WrappedStyledComponent, 'defaultProps', {
            get() {
                return this._foldedDefaultProps;
            },
            set(obj) {
                this._foldedDefaultProps = isTargetStyledComp
                    ? mixinDeep({}, styledComponentTarget.defaultProps, obj)
                    : obj;
            },
        });
        {
            checkDynamicCreation(displayName, styledComponentId);
            WrappedStyledComponent.warnTooManyClasses = createWarnTooManyClasses(displayName, styledComponentId);
        }
        setToString(WrappedStyledComponent, () => `.${WrappedStyledComponent.styledComponentId}`);
        if (isCompositeComponent) {
            const compositeComponentTarget = target;
            hoistNonReactStatics(WrappedStyledComponent, compositeComponentTarget, {
                // all SC-specific things should not be hoisted
                attrs: true,
                componentStyle: true,
                displayName: true,
                foldedComponentIds: true,
                shouldForwardProp: true,
                styledComponentId: true,
                target: true,
            });
        }
        return WrappedStyledComponent;
    }

    // prettier-ignore
    const elements = [
        'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote', 'body', 'button', 'br', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'menu', 'meter', 'nav', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'slot', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var', 'video', 'wbr', 'circle', 'clipPath', 'defs', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'foreignObject', 'g', 'image', 'line', 'linearGradient', 'marker', 'mask', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'switch', 'symbol', 'text', 'textPath', 'tspan', 'use',
    ];
    var domElements = new Set(elements);

    function constructWithOptions(componentConstructor, tag, options = EMPTY_OBJECT) {
        /**
         * We trust that the tag is a valid component as long as it isn't
         * falsish. Typically the tag here is a string or function (i.e.
         * class or pure function component), however a component may also be
         * an object if it uses another utility, e.g. React.memo. React will
         * output an appropriate warning however if the `tag` isn't valid.
         */
        if (!tag) {
            throw throwStyledComponentsError(1, tag);
        }
        /* This is callable directly as a template function */
        const templateFunction = (initialStyles, ...interpolations) => componentConstructor(tag, options, css(initialStyles, ...interpolations));
        /**
         * Attrs allows for accomplishing two goals:
         *
         * 1. Backfilling props at runtime more expressively than defaultProps
         * 2. Amending the prop interface of a wrapped styled component
         */
        templateFunction.attrs = (attrs) => constructWithOptions(componentConstructor, tag, Object.assign(Object.assign({}, options), { attrs: Array.prototype.concat(options.attrs, attrs).filter(Boolean) }));
        /**
         * If config methods are called, wrap up a new template function
         * and merge options.
         */
        templateFunction.withConfig = (config) => constructWithOptions(componentConstructor, tag, Object.assign(Object.assign({}, options), config));
        return templateFunction;
    }

    /**
     * Create a styled component from an HTML element or React component.
     *
     * ```tsx
     * const Button = styled.button`color: red;`;
     * const Link = styled(RouterLink)`text-decoration: none;`;
     * ```
     */
    const baseStyled = (tag) => constructWithOptions(createStyledComponent, tag);
    const styled = baseStyled;
    // Shorthands for all valid HTML Elements.
    // The type assertion avoids 120 Styled<> instantiations during type checking -
    // the correct types are declared on the `styled` const above via the mapped type.
    domElements.forEach(domElement => {
        styled[domElement] = baseStyled(domElement);
    });

    /**
     * eliminates the need to do styled.default since the other APIs
     * are directly assigned as properties to the main function
     * */
    for (const key in secondary) {
        // @ts-expect-error shush
        styled[key] = secondary[key];
    }

    exports.default = styled;
    exports.styled = styled;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=styled-components.js.map
