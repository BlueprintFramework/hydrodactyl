'use client';
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const fs = require('node:fs');
const t = require('@babel/types');
const colors = require('kleur/colors');
const core = require('@babel/core');
const pluginutils = require('@rollup/pluginutils');
const unplugin$1 = require('unplugin');
const node_crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const process$1 = require('node:process');
const undici = require('undici');
const node_child_process = require('node:child_process');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const t__namespace = /*#__PURE__*/_interopNamespaceCompat(t);
const os__default = /*#__PURE__*/_interopDefaultCompat(os);
const path__default = /*#__PURE__*/_interopDefaultCompat(path);
const process__default = /*#__PURE__*/_interopDefaultCompat(process$1);

const SKIP_ANNOTATION = "@million skip";
const IGNORE_ANNOTATION = "million-ignore";
const JSX_SKIP_ANNOTATION = "@million jsx-skip";
const SVG_ELEMENTS = [
  "circle",
  "ellipse",
  "foreignObject",
  "image",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "textPath",
  "tspan",
  "svg",
  "g"
];
const INVERSE_IMPORTS = {
  client: {
    source: "million/react-server",
    target: "million/react"
  },
  server: {
    source: "million/react",
    target: "million/react-server"
  }
};
const TRACKED_IMPORTS = {
  block: {
    client: {
      kind: "named",
      name: "block",
      source: "million/react"
    },
    server: {
      kind: "named",
      name: "block",
      source: "million/react-server"
    }
  },
  For: {
    client: {
      kind: "named",
      name: "For",
      source: "million/react"
    },
    server: {
      kind: "named",
      name: "For",
      source: "million/react-server"
    }
  }
};
const HIDDEN_IMPORTS = {
  compiledBlock: {
    client: {
      kind: "named",
      name: "compiledBlock",
      source: "million/react"
    },
    server: {
      kind: "named",
      name: "compiledBlock",
      source: "million/react-server"
    }
  }
};
const REACT_IMPORTS = {
  memo: {
    client: {
      kind: "named",
      name: "memo",
      source: "react"
    },
    server: {
      kind: "named",
      name: "memo",
      source: "react"
    }
  }
};

function isPathValid(path, key) {
  return key(path.node);
}
function isNestedExpression(node) {
  switch (node.type) {
    case "ParenthesizedExpression":
    case "TypeCastExpression":
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TSTypeAssertion":
    case "TSInstantiationExpression":
      return true;
    default:
      return false;
  }
}
function isComponent(node) {
  switch (node.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "FunctionDeclaration":
      return true;
    default:
      return false;
  }
}
function isComponentishName(name) {
  return name[0] >= "A" && name[0] <= "Z";
}
function isStatementTopLevel(path) {
  let blockParent = path.scope.getBlockParent();
  const programParent = path.scope.getProgramParent();
  if (blockParent.path === path) {
    blockParent = blockParent.parent;
  }
  return programParent === blockParent;
}

function generateUniqueName(path, name) {
  let uid;
  let i = 1;
  do {
    uid = `${name}_${i}`;
    i++;
  } while (path.scope.hasLabel(uid) || path.scope.hasBinding(uid) || path.scope.hasGlobal(uid) || path.scope.hasReference(uid));
  const program = path.scope.getProgramParent();
  program.references[uid] = true;
  program.uids[uid] = true;
  return t__namespace.identifier(uid);
}

function getDescriptiveName(path, defaultName) {
  let current = path;
  while (current) {
    switch (current.node.type) {
      case "FunctionDeclaration":
      case "FunctionExpression": {
        if (current.node.id) {
          return current.node.id.name;
        }
        break;
      }
      case "VariableDeclarator": {
        if (current.node.id.type === "Identifier") {
          return current.node.id.name;
        }
        break;
      }
      case "ClassPrivateMethod":
      case "ClassMethod":
      case "ObjectMethod": {
        switch (current.node.key.type) {
          case "Identifier":
            return current.node.key.name;
          case "PrivateName":
            return current.node.key.id.name;
        }
        break;
      }
    }
    current = current.parentPath;
  }
  return defaultName;
}

function getImportIdentifier(state, path, registration) {
  const name = registration.kind === "named" ? registration.name : "default";
  const target = `${registration.source}[${name}]`;
  const current = state.imports.get(target);
  if (current) {
    return current;
  }
  const programParent = path.scope.getProgramParent();
  const uid = programParent.generateUidIdentifier(
    registration.kind === "named" ? registration.name : "default"
  );
  const newPath = programParent.path.unshiftContainer(
    "body",
    t__namespace.importDeclaration(
      [
        registration.kind === "named" ? t__namespace.importSpecifier(uid, t__namespace.identifier(registration.name)) : t__namespace.importDefaultSpecifier(uid)
      ],
      t__namespace.stringLiteral(registration.source)
    )
  )[0];
  programParent.registerDeclaration(newPath);
  state.imports.set(target, uid);
  return uid;
}

function getRootStatementPath(path) {
  let current = path.parentPath;
  while (current) {
    const next = current.parentPath;
    if (next && t__namespace.isProgram(next.node)) {
      return current;
    }
    current = next;
  }
  return path;
}

function unwrapNode(node, key) {
  if (key(node)) {
    return node;
  }
  if (isNestedExpression(node)) {
    return unwrapNode(node.expression, key);
  }
  return void 0;
}

function isValidIdentifier(node) {
  return t__namespace.isIdentifier(node) || t__namespace.isJSXIdentifier(node);
}
function getValidImportDefinitionFromIdentifier(ctx, path) {
  const id = unwrapNode(path.node, isValidIdentifier);
  if (id) {
    const binding = path.scope.getBindingIdentifier(id.name);
    if (binding) {
      return ctx.definitions.identifiers.get(binding);
    }
    return void 0;
  }
  return void 0;
}
function getValidImportDefinitionFromMemberExpression(ctx, path) {
  const member = unwrapNode(path.node, t__namespace.isMemberExpression);
  if (!(member && !member.computed && t__namespace.isIdentifier(member.property))) {
    return void 0;
  }
  const object = unwrapNode(member.object, t__namespace.isIdentifier);
  if (!object) {
    return void 0;
  }
  const binding = path.scope.getBindingIdentifier(object.name);
  if (!binding) {
    return void 0;
  }
  const defs = ctx.definitions.namespaces.get(binding);
  if (!defs) {
    return void 0;
  }
  const propName = member.property.name;
  for (let i = 0, len = defs.length; i < len; i++) {
    const def = defs[i];
    if (def.kind === "named" && def.name === propName) {
      return def;
    }
    if (def.kind === "default" && propName === "default") {
      return def;
    }
  }
  return void 0;
}
function getValidImportDefinitionFromJSXMemberExpression(ctx, path) {
  if (!path.isJSXMemberExpression()) {
    return void 0;
  }
  const object = unwrapNode(path.node.object, t__namespace.isJSXIdentifier);
  if (!object) {
    return void 0;
  }
  const binding = path.scope.getBindingIdentifier(object.name);
  if (!binding) {
    return void 0;
  }
  const defs = ctx.definitions.namespaces.get(binding);
  if (!defs) {
    return void 0;
  }
  const propName = path.node.property.name;
  for (let i = 0, len = defs.length; i < len; i++) {
    const def = defs[i];
    if (def.kind === "named" && def.name === propName) {
      return def;
    }
    if (def.kind === "default" && propName === "default") {
      return def;
    }
  }
  return void 0;
}
function getValidImportDefinition(ctx, path) {
  return getValidImportDefinitionFromIdentifier(ctx, path) || getValidImportDefinitionFromMemberExpression(ctx, path) || getValidImportDefinitionFromJSXMemberExpression(ctx, path);
}

function isGuaranteedLiteral(node) {
  switch (node.type) {
    case "ParenthesizedExpression":
    case "TypeCastExpression":
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TSTypeAssertion":
    case "TSInstantiationExpression":
      return isGuaranteedLiteral(node.expression);
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
    case "BigIntLiteral":
    case "RegExpLiteral":
      return true;
    case "TemplateLiteral":
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        const expr = node.expressions[i];
        if (t__namespace.isExpression(expr) && !isGuaranteedLiteral(expr)) {
          return false;
        }
      }
      return true;
    case "UnaryExpression":
      if (node.operator === "throw" || node.operator === "delete") {
        return false;
      }
      return isGuaranteedLiteral(node.argument);
    case "ConditionalExpression":
      return isGuaranteedLiteral(node.test) && isGuaranteedLiteral(node.consequent) && isGuaranteedLiteral(node.alternate);
    case "BinaryExpression":
      if (node.operator === "in" || node.operator === "instanceof" || node.operator === "|>") {
        return false;
      }
      return t__namespace.isExpression(node.left) && isGuaranteedLiteral(node.left) && t__namespace.isExpression(node.right) && isGuaranteedLiteral(node.right);
    case "LogicalExpression":
      return isGuaranteedLiteral(node.left) && isGuaranteedLiteral(node.right);
    default:
      return false;
  }
}

const isAttributeUnsupported = (attribute) => {
  const UNSUPPORTED = ["tw", "css"];
  const attributeName = attribute.name.name;
  return typeof attributeName === "string" && UNSUPPORTED.includes(attributeName);
};

function isJSXComponentElement(path) {
  const openingElement = path.get("openingElement");
  const name = openingElement.get("name");
  if (isPathValid(name, t__namespace.isJSXMemberExpression)) {
    return true;
  }
  if (isPathValid(name, t__namespace.isJSXIdentifier)) {
    if (/^[A-Z_]/.test(name.node.name)) {
      return true;
    }
  }
  const attributes = openingElement.get("attributes");
  for (let i = 0, len = attributes.length; i < len; i++) {
    const attr = attributes[i];
    if (isPathValid(attr, t__namespace.isJSXAttribute)) {
      if (isAttributeUnsupported(attr.node) || attr.node.name.name === "ref") {
        return true;
      }
    }
  }
  return false;
}

let hasIntroRan = false;
const displayIntro = (options) => {
  if (hasIntroRan)
    return;
  hasIntroRan = true;
  const experiments = [];
  if (typeof options.auto === "object" && options.auto.rsc) {
    experiments.push("auto-rsc");
  }
  if (options.optimize) {
    experiments.push("optimize");
  }
  let message = `
  ${colors.bold(
    colors.magenta(`\u26A1 Million.js ${"3.1.11" }`)
  )}
  - Tip:     use ${colors.dim("// million-ignore")} for errors
  - Hotline: ${colors.cyan("https://million.dev/hotline")}
`;
  if (experiments.length) {
    message += `
  - Experiments (use at your own risk):
      \xB7 ${experiments.join("\n      \xB7 ")}
  `;
  }
  console.log(`${message}
`);
};
const logImprovement = (component, improvement, telemetry) => {
  void telemetry.record({
    event: "improvement",
    payload: { component, improvement }
  });
  const improvementFormatted = isFinite(improvement) ? (improvement * 100).toFixed(0) : "\u221E";
  console.log(
    `${colors.magenta(" \u26A1 ")}${colors.yellow(`<${component}>`)} now renders ${colors.green(
      colors.underline(`~${improvementFormatted}%`)
    )} faster`
  );
};

const isUseClient = (directives) => {
  const directivesLength = directives.length;
  if (!directivesLength)
    return false;
  for (let i = 0; i < directivesLength; ++i) {
    const directive = directives[i];
    if (directive?.value.value === "use client")
      return true;
  }
  return false;
};

function getImportSpecifierName(specifier) {
  if (t__namespace.isIdentifier(specifier.imported)) {
    return specifier.imported.name;
  }
  return specifier.imported.value;
}
function registerImportDefinition(ctx, path, definition) {
  if (path.node.importKind === "typeof" || path.node.importKind === "type") {
    return;
  }
  for (let i = 0, len = path.node.specifiers.length; i < len; i++) {
    const specifier = path.node.specifiers[i];
    if (t__namespace.isImportDefaultSpecifier(specifier)) {
      if (definition.kind === "default") {
        ctx.definitions.identifiers.set(specifier.local, definition);
      }
    } else if (t__namespace.isImportNamespaceSpecifier(specifier)) {
      let current = ctx.definitions.namespaces.get(specifier.local);
      if (!current) {
        current = [];
      }
      current.push(definition);
      ctx.definitions.namespaces.set(specifier.local, current);
    } else if (!(specifier.importKind === "typeof" || specifier.importKind === "type")) {
      const key = getImportSpecifierName(specifier);
      if (definition.kind === "named" && key === definition.name || definition.kind === "default" && key === "default") {
        ctx.definitions.identifiers.set(specifier.local, definition);
      }
    }
  }
}

function unwrapPath(path, key) {
  if (isPathValid(path, key)) {
    return path;
  }
  if (isPathValid(path, isNestedExpression)) {
    return unwrapPath(path.get("expression"), key);
  }
  return void 0;
}

const findComment = (node, comment) => {
  const comments = node.leadingComments;
  if (!comments)
    return null;
  for (let i = 0, j = comments.length; i < j; ++i) {
    if (comments[i]?.value.trim() === comment) {
      return comments[i];
    }
  }
};
const shouldBeIgnored = (path) => {
  for (const comment of path.node.leadingComments ?? []) {
    if (comment.value.includes(IGNORE_ANNOTATION)) {
      return true;
    }
  }
  if (path.parentPath) {
    return shouldBeIgnored(path.parentPath);
  }
  return false;
};

function measureExpression(state, expr, portal) {
  const unwrappedJSX = unwrapPath(expr, t__namespace.isJSXElement);
  if (unwrappedJSX) {
    measureJSXExpressions(state, unwrappedJSX);
    return;
  }
  const unwrappedFragment = unwrapPath(expr, t__namespace.isJSXFragment);
  if (unwrappedFragment) {
    measureJSXExpressions(state, unwrappedFragment);
    return;
  }
  if (isGuaranteedLiteral(expr.node)) {
    return;
  }
  if (portal) {
    state.components++;
  } else {
    state.attributes++;
  }
}
function measureJSXSpreadChild(state, path) {
  measureExpression(state, path.get("expression"), false);
}
function measureJSXExpressionContainer(state, path, portal) {
  const expr = path.get("expression");
  if (isPathValid(expr, t__namespace.isExpression)) {
    measureExpression(state, expr, portal);
  }
}
function measureJSXAttribute(state, attr) {
  const value = attr.get("value");
  if (isPathValid(value, t__namespace.isJSXElement)) {
    measureJSXExpressions(state, value);
  } else if (isPathValid(value, t__namespace.isJSXFragment)) {
    measureJSXExpressions(state, value);
  } else if (isPathValid(value, t__namespace.isJSXExpressionContainer)) {
    measureJSXExpressionContainer(state, value, false);
  }
}
function measureJSXSpreadAttribute(state, attr) {
  measureExpression(state, attr.get("argument"), false);
}
function measureJSXAttributes(state, attrs) {
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i];
    if (isPathValid(attr, t__namespace.isJSXAttribute)) {
      measureJSXAttribute(state, attr);
    } else if (isPathValid(attr, t__namespace.isJSXSpreadAttribute)) {
      measureJSXSpreadAttribute(state, attr);
    }
  }
}
function measureJSXElement(state, path) {
  const openingElement = path.get("openingElement");
  if (isJSXComponentElement(path)) {
    state.components++;
    return true;
  }
  state.elements++;
  measureJSXAttributes(state, openingElement.get("attributes"));
  return false;
}
function measureJSXExpressions(state, path) {
  if (isPathValid(path, t__namespace.isJSXElement) && measureJSXElement(state, path)) {
    return;
  }
  const children = path.get("children");
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (isPathValid(child, t__namespace.isJSXElement)) {
      measureJSXExpressions(state, child);
    } else if (isPathValid(child, t__namespace.isJSXFragment)) {
      measureJSXExpressions(state, child);
    } else if (isPathValid(child, t__namespace.isJSXSpreadChild)) {
      measureJSXSpreadChild(state, child);
    } else if (isPathValid(child, t__namespace.isJSXExpressionContainer)) {
      measureJSXExpressionContainer(state, child, true);
    } else if (isPathValid(child, t__namespace.isJSXText)) {
      if (child.node.value.trim() !== "")
        state.text++;
    }
  }
}
function shouldTransform(ctx, name, path) {
  const state = {
    bailout: false,
    elements: 0,
    components: 0,
    attributes: 0,
    text: 0,
    returns: 0
  };
  path.traverse({
    JSXElement(innerPath) {
      measureJSXExpressions(state, innerPath);
      innerPath.skip();
    },
    JSXFragment(innerPath) {
      measureJSXExpressions(state, innerPath);
      innerPath.skip();
    },
    ReturnStatement(innerPath) {
      if (innerPath.scope.uid !== path.scope.uid)
        return;
      state.returns++;
      if (state.returns > 1) {
        state.bailout = true;
        innerPath.stop();
      }
    }
  });
  if (state.bailout)
    return false;
  const good = state.elements + state.attributes + state.text;
  if (good < 5)
    return false;
  const bad = state.components;
  const improvement = (good - bad) / (good + bad);
  if (isNaN(improvement) || !isFinite(improvement))
    return false;
  const threshold = typeof ctx.options.auto === "object" && ctx.options.auto.threshold ? ctx.options.auto.threshold : 0.1;
  if (improvement <= threshold)
    return false;
  if (ctx.options.log === true || ctx.options.log === "info") {
    logImprovement(
      name,
      improvement,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      ctx.options.telemetry
    );
  }
  return true;
}
function transformFunctionDeclaration(ctx, program, path) {
  if (isStatementTopLevel(path)) {
    if (shouldBeIgnored(path)) {
      return;
    }
    const decl = path.node;
    if (
      // Check if the declaration has an identifier, and then check
      decl.id && // if the name is component-ish
      isComponentishName(decl.id.name) && // Might be component-like, but the only valid components
      // have zero or one parameter
      decl.params.length < 2 && // For RSC, only transform if it's a client component
      (ctx.options.rsc ? ctx.topLevelRSC || isUseClient(decl.body.directives) : true) && // Check if the function should be transformed
      shouldTransform(ctx, decl.id.name, path)
    ) {
      const newPath = program.unshiftContainer(
        "body",
        t__namespace.variableDeclaration("const", [
          t__namespace.variableDeclarator(
            decl.id,
            t__namespace.callExpression(
              getImportIdentifier(
                ctx,
                path,
                TRACKED_IMPORTS.block[ctx.serverMode]
              ),
              [
                t__namespace.functionExpression(
                  decl.id,
                  decl.params,
                  decl.body,
                  decl.generator,
                  decl.async
                )
              ]
            )
          )
        ])
      )[0];
      program.scope.registerDeclaration(newPath);
      newPath.skip();
      if (path.parentPath.isExportNamedDeclaration()) {
        path.parentPath.replaceWith(
          t__namespace.exportNamedDeclaration(void 0, [
            t__namespace.exportSpecifier(decl.id, decl.id)
          ])
        );
      } else if (path.parentPath.isExportDefaultDeclaration()) {
        path.replaceWith(decl.id);
      } else {
        path.remove();
      }
    }
  }
}
function isValidFunction(node) {
  return t__namespace.isArrowFunctionExpression(node) || t__namespace.isFunctionExpression(node);
}
function transformVariableDeclarator(ctx, program, path) {
  if (path.parentPath.isVariableDeclaration() && !isStatementTopLevel(path.parentPath)) {
    return;
  }
  if (shouldBeIgnored(path)) {
    return;
  }
  const identifier = path.node.id;
  if (!t__namespace.isIdentifier(identifier)) {
    return;
  }
  const init = path.get("init");
  if (isComponentishName(identifier.name) && init.node) {
    const trueFuncExpr = unwrapNode(init.node, isValidFunction);
    if (trueFuncExpr && // Must not be async or generator
    !(trueFuncExpr.async || trueFuncExpr.generator) && // Might be component-like, but the only valid components
    t__namespace.isIdentifier(identifier) && isComponentishName(identifier.name) && // have zero or one parameter
    trueFuncExpr.params.length < 2 && // For RSC, only transform if it's a client component
    (ctx.options.rsc ? ctx.topLevelRSC || t__namespace.isBlockStatement(trueFuncExpr.body) && isUseClient(trueFuncExpr.body.directives) : true) && // Check if the function should be transformed
    shouldTransform(ctx, identifier.name, path)) {
      path.node.init = t__namespace.callExpression(
        getImportIdentifier(ctx, path, TRACKED_IMPORTS.block[ctx.serverMode]),
        [trueFuncExpr]
      );
    }
  }
}
function transformCallExpression(ctx, path) {
  if (shouldBeIgnored(path)) {
    return;
  }
  const definition = getValidImportDefinition(ctx, path.get("callee"));
  if (definition === REACT_IMPORTS.memo[ctx.serverMode]) {
    const args = path.get("arguments");
    const arg = args[0];
    const trueFuncExpr = unwrapPath(arg, isValidFunction);
    if (trueFuncExpr) {
      const descriptiveName = getDescriptiveName(trueFuncExpr, "Anonymous");
      if (
        // For RSC, only transform if it's a client component
        (ctx.options.rsc ? ctx.topLevelRSC || t__namespace.isBlockStatement(trueFuncExpr.node.body) && isUseClient(trueFuncExpr.node.body.directives) : true) && shouldTransform(ctx, descriptiveName, path)
      ) {
        const root = getRootStatementPath(trueFuncExpr);
        const uid = generateUniqueName(trueFuncExpr, descriptiveName);
        root.scope.registerDeclaration(
          root.insertBefore(
            t__namespace.variableDeclaration("const", [
              t__namespace.variableDeclarator(
                uid,
                t__namespace.callExpression(
                  getImportIdentifier(
                    ctx,
                    path,
                    TRACKED_IMPORTS.block[ctx.serverMode]
                  ),
                  [trueFuncExpr.node]
                )
              )
            ])
          )[0]
        );
        trueFuncExpr.replaceWith(uid);
      }
    }
  }
}
function transformAuto(ctx, program) {
  program.traverse({
    ImportDeclaration(path) {
      const mod = path.node.source.value;
      for (const importName in REACT_IMPORTS) {
        const definition = REACT_IMPORTS[importName][ctx.serverMode];
        if (definition.source === mod) {
          registerImportDefinition(ctx, path, definition);
        }
      }
    }
  });
  program.traverse({
    FunctionDeclaration(path) {
      transformFunctionDeclaration(ctx, program, path);
    },
    VariableDeclarator(path) {
      transformVariableDeclarator(ctx, program, path);
    },
    CallExpression(path) {
      transformCallExpression(ctx, path);
    }
  });
}

function pushExpression(state, expr) {
  const key = `v${state.exprs.length}`;
  state.exprs.push(
    t__namespace.jsxAttribute(
      t__namespace.jsxIdentifier(key),
      t__namespace.jsxExpressionContainer(t__namespace.cloneNode(expr))
    )
  );
  return key;
}
function pushExpressionAndReplace(state, target, top, portal) {
  if (isGuaranteedLiteral(target.node)) {
    return;
  }
  const key = pushExpression(state, target.node);
  const expr = t__namespace.memberExpression(state.source, t__namespace.identifier(key));
  target.replaceWith(top ? expr : t__namespace.jsxExpressionContainer(expr));
  if (portal) {
    state.keys.push(t__namespace.stringLiteral(key));
  }
}
function extractJSXExpressionsFromExpression(state, expr, portal) {
  const unwrappedJSX = unwrapPath(expr, t__namespace.isJSXElement);
  if (unwrappedJSX) {
    extractJSXExpressions(state, unwrappedJSX, true);
    return;
  }
  const unwrappedFragment = unwrapPath(expr, t__namespace.isJSXFragment);
  if (unwrappedFragment) {
    extractJSXExpressions(state, unwrappedFragment, true);
    return;
  }
  pushExpressionAndReplace(state, expr, true, portal);
}
function extractJSXExpressionsFromJSXSpreadChild(state, path) {
  extractJSXExpressionsFromExpression(state, path.get("expression"), false);
}
function extractJSXExpressionsFromJSXExpressionContainer(state, path, portal) {
  const expr = path.get("expression");
  if (isPathValid(expr, t__namespace.isExpression)) {
    extractJSXExpressionsFromExpression(state, expr, portal);
  }
}
function extractJSXExpressionsFromJSXAttribute(state, attr) {
  const value = attr.get("value");
  if (isPathValid(value, t__namespace.isJSXElement)) {
    extractJSXExpressions(state, value, false);
  } else if (isPathValid(value, t__namespace.isJSXFragment)) {
    extractJSXExpressions(state, value, false);
  } else if (isPathValid(value, t__namespace.isJSXExpressionContainer)) {
    extractJSXExpressionsFromJSXExpressionContainer(state, value, false);
  }
}
function extractJSXExpressionsFromJSXSpreadAttribute(state, attr) {
  extractJSXExpressionsFromExpression(state, attr.get("argument"), false);
}
function extractJSXExpressionsFromJSXAttributes(state, attrs) {
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i];
    if (isPathValid(attr, t__namespace.isJSXAttribute)) {
      extractJSXExpressionsFromJSXAttribute(state, attr);
    } else if (isPathValid(attr, t__namespace.isJSXSpreadAttribute)) {
      extractJSXExpressionsFromJSXSpreadAttribute(state, attr);
    }
  }
}
function isJSXSVGElement(path) {
  const openingElement = path.get("openingElement");
  const name = openingElement.get("name");
  if (isPathValid(name, t__namespace.isJSXIdentifier)) {
    if (SVG_ELEMENTS.includes(name.node.name)) {
      return true;
    }
  }
  return false;
}
function isJSXForElement(ctx, path) {
  const openingElement = path.get("openingElement");
  const name = openingElement.get("name");
  if (isPathValid(name, t__namespace.isJSXIdentifier) || isPathValid(name, t__namespace.isJSXMemberExpression)) {
    return getValidImportDefinition(ctx, name) === TRACKED_IMPORTS.For[ctx.serverMode];
  }
  return false;
}
function transformJSXForElement(ctx, path) {
  if (isJSXForElement(ctx, path)) {
    path.node.openingElement.attributes.push(
      t__namespace.jsxAttribute(t__namespace.jsxIdentifier("scoped"))
    );
  }
}
function extractJSXExpressionsFromJSXElement(state, path, top) {
  const openingElement = path.get("openingElement");
  if (isJSXComponentElement(path)) {
    transformJSXForElement(state.ctx, path);
    pushExpressionAndReplace(state, path, top, true);
    return true;
  }
  extractJSXExpressionsFromJSXAttributes(
    state,
    openingElement.get("attributes")
  );
  return false;
}
function extractJSXChildren(state, children) {
  const newChildren = [];
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (isPathValid(child, t__namespace.isJSXElement)) {
      extractJSXExpressions(state, child, false);
    } else if (isPathValid(child, t__namespace.isJSXFragment)) {
      Array.prototype.push.apply(
        newChildren,
        extractJSXChildren(state, child.get("children"))
      );
    } else if (isPathValid(child, t__namespace.isJSXSpreadChild)) {
      extractJSXExpressionsFromJSXSpreadChild(state, child);
    } else if (isPathValid(child, t__namespace.isJSXExpressionContainer)) {
      extractJSXExpressionsFromJSXExpressionContainer(state, child, true);
    }
    if (child && !isPathValid(child, t__namespace.isJSXFragment)) {
      newChildren.push(child.node);
    }
  }
  return newChildren;
}
function extractJSXExpressions(state, path, top) {
  if (isPathValid(path, t__namespace.isJSXElement) && extractJSXExpressionsFromJSXElement(state, path, top)) {
    return;
  }
  if (isPathValid(path, t__namespace.isJSXFragment)) {
    path.replaceWith(
      t__namespace.jsxElement(
        t__namespace.jsxOpeningElement(t__namespace.jsxIdentifier("slot"), []),
        t__namespace.jsxClosingElement(t__namespace.jsxIdentifier("slot")),
        path.node.children
      )
    );
  }
  path.node.children = extractJSXChildren(state, path.get("children"));
}
function transformJSX(ctx, path) {
  if (findComment(path.node, JSX_SKIP_ANNOTATION)) {
    path.skip();
    return;
  }
  const state = {
    ctx,
    source: path.scope.generateUidIdentifier("props"),
    exprs: [],
    keys: []
  };
  extractJSXExpressions(
    state,
    path,
    !(isPathValid(path.parentPath, t__namespace.isJSXElement) || isPathValid(path.parentPath, t__namespace.isJSXFragment) || isPathValid(path.parentPath, t__namespace.isJSXAttribute))
  );
  const descriptiveName = getDescriptiveName(path, "Anonymous");
  const id = generateUniqueName(
    path,
    isComponentishName(descriptiveName) ? descriptiveName : `JSX_${descriptiveName}`
  );
  if (ctx.options.hmr) {
    state.exprs.push(
      t__namespace.jsxAttribute(
        t__namespace.jsxIdentifier("_hmr"),
        t__namespace.stringLiteral(String(Date.now()))
      )
    );
  }
  const args = [];
  if (state.exprs.length) {
    args.push(state.source);
  } else {
    path.scope.removeBinding(state.source.name);
  }
  const newComponent = t__namespace.arrowFunctionExpression(args, path.node);
  const options = [
    // TODO add dev mode
    t__namespace.objectProperty(t__namespace.identifier("name"), t__namespace.stringLiteral(id.name))
  ];
  if (state.keys.length) {
    options.push(
      t__namespace.objectProperty(t__namespace.identifier("portals"), t__namespace.arrayExpression(state.keys))
    );
  }
  if (isPathValid(path, t__namespace.isJSXElement) && isJSXSVGElement(path)) {
    options.push(t__namespace.objectProperty(t__namespace.identifier("svg"), t__namespace.booleanLiteral(true)));
  }
  const generatedBlock = t__namespace.variableDeclaration("const", [
    t__namespace.variableDeclarator(
      id,
      t__namespace.callExpression(
        getImportIdentifier(
          ctx,
          path,
          HIDDEN_IMPORTS.compiledBlock[ctx.serverMode]
        ),
        [newComponent, t__namespace.objectExpression(options)]
      )
    )
  ]);
  const rootPath = getRootStatementPath(path);
  rootPath.scope.registerDeclaration(rootPath.insertBefore(generatedBlock)[0]);
  path.replaceWith(
    t__namespace.addComment(
      t__namespace.jsxElement(
        t__namespace.jsxOpeningElement(t__namespace.jsxIdentifier(id.name), state.exprs, true),
        t__namespace.jsxClosingElement(t__namespace.jsxIdentifier(id.name)),
        [],
        true
      ),
      "leading",
      JSX_SKIP_ANNOTATION
    )
  );
}
function transformBlock(ctx, path) {
  if (shouldBeIgnored(path)) {
    return;
  }
  const definition = getValidImportDefinition(ctx, path.get("callee"));
  if (TRACKED_IMPORTS.block[ctx.serverMode] !== definition) {
    return;
  }
  if (findComment(path.node, SKIP_ANNOTATION)) {
    return;
  }
  const args = path.get("arguments");
  if (args.length <= 0) {
    return;
  }
  const identifier = unwrapPath(args[0], t__namespace.isIdentifier);
  if (identifier) {
    return;
  }
  const component = unwrapPath(args[0], isComponent);
  if (!component) {
    return;
  }
  component.traverse({
    JSXElement(childPath) {
      const functionParent = childPath.getFunctionParent();
      if (functionParent === component) {
        transformJSX(ctx, childPath);
      }
    },
    JSXFragment(childPath) {
      const functionParent = childPath.getFunctionParent();
      if (functionParent === component) {
        transformJSX(ctx, childPath);
      }
    }
  });
  path.replaceWith(component);
}

function babel() {
  return {
    name: "million",
    pre() {
      this.state = {
        options: this.opts,
        definitions: {
          identifiers: /* @__PURE__ */ new Map(),
          namespaces: /* @__PURE__ */ new Map()
        },
        imports: /* @__PURE__ */ new Map(),
        topLevelRSC: false,
        serverMode: this.opts.server ? "server" : "client"
      };
    },
    visitor: {
      Program(programPath, ctx) {
        if (ctx.state.options.rsc) {
          ctx.state.topLevelRSC = isUseClient(programPath.node.directives);
        }
        if (ctx.state.options.auto) {
          transformAuto(ctx.state, programPath);
        }
        programPath.traverse({
          ImportDeclaration(path) {
            if (INVERSE_IMPORTS[ctx.state.serverMode].source === path.node.source.value) {
              path.node.source.value = INVERSE_IMPORTS[ctx.state.serverMode].target;
            }
            const mod = path.node.source.value;
            for (const importName in TRACKED_IMPORTS) {
              const definition = TRACKED_IMPORTS[importName][ctx.state.serverMode];
              if (definition.source === mod) {
                registerImportDefinition(ctx.state, path, definition);
              }
            }
          }
        });
      },
      CallExpression(path, ctx) {
        transformBlock(ctx.state, path);
      }
    }
  };
}

const env = process.env;
const info = {
  name: null,
  isPR: null
};
const init = (vendors) => {
  for (const vendor of vendors) {
    const envs = Array.isArray(vendor.env) ? vendor.env : [vendor.env];
    const isCI2 = envs.every((obj) => checkEnv(obj));
    info[vendor.constant] = isCI2;
    if (!isCI2) {
      return;
    }
    info.name = vendor.name;
    switch (typeof vendor.pr) {
      case "string":
        info.isPR = Boolean(env[vendor.pr]);
        break;
      case "object":
        if ("env" in vendor.pr && vendor.pr.env) {
          info.isPR = vendor.pr.env in env && env[vendor.pr.env] !== vendor.pr.ne;
        } else if ("any" in vendor.pr) {
          info.isPR = vendor.pr.any?.some((key) => Boolean(env[key]));
        } else {
          info.isPR = checkEnv(vendor.pr);
        }
        break;
      default:
        info.isPR = null;
    }
  }
};
const getCI = () => info.name;
const isCI = Boolean(
  env.CI !== "false" && // Bypass all checks if CI env is explicitly set to 'false'
  (env.BUILD_ID || // Jenkins, Cloudbees
  env.BUILD_NUMBER || // Jenkins, TeamCity
  env.CI || // Travis CI, CircleCI, Cirrus CI, Gitlab CI, Appveyor, CodeShip, dsari
  env.CI_APP_ID || // Appflow
  env.CI_BUILD_ID || // Appflow
  env.CI_BUILD_NUMBER || // Appflow
  env.CI_NAME || // Codeship and others
  env.CONTINUOUS_INTEGRATION || // Travis CI, Cirrus CI
  env.RUN_ID || // TaskCluster, dsari
  info.name || false)
);
const checkEnv = (obj) => {
  if (typeof obj === "string")
    return Boolean(env[obj]);
  if ("env" in obj) {
    return Boolean(env[obj.env] && env[obj.env]?.includes(obj.includes));
  }
  if ("any" in obj) {
    return obj.any.some((k) => Boolean(env[k]));
  }
  return Object.keys(obj).every((k) => env[k] === obj[k]);
};
const VENDORS = [
  {
    name: "Agola CI",
    constant: "AGOLA",
    env: "AGOLA_GIT_REF",
    pr: "AGOLA_PULL_REQUEST_ID"
  },
  {
    name: "Appcircle",
    constant: "APPCIRCLE",
    env: "AC_APPCIRCLE"
  },
  {
    name: "AppVeyor",
    constant: "APPVEYOR",
    env: "APPVEYOR",
    pr: "APPVEYOR_PULL_REQUEST_NUMBER"
  },
  {
    name: "AWS CodeBuild",
    constant: "CODEBUILD",
    env: "CODEBUILD_BUILD_ARN"
  },
  {
    name: "Azure Pipelines",
    constant: "AZURE_PIPELINES",
    env: "TF_BUILD",
    pr: {
      BUILD_REASON: "PullRequest"
    }
  },
  {
    name: "Bamboo",
    constant: "BAMBOO",
    env: "bamboo_planKey"
  },
  {
    name: "Bitbucket Pipelines",
    constant: "BITBUCKET",
    env: "BITBUCKET_COMMIT",
    pr: "BITBUCKET_PR_ID"
  },
  {
    name: "Bitrise",
    constant: "BITRISE",
    env: "BITRISE_IO",
    pr: "BITRISE_PULL_REQUEST"
  },
  {
    name: "Buddy",
    constant: "BUDDY",
    env: "BUDDY_WORKSPACE_ID",
    pr: "BUDDY_EXECUTION_PULL_REQUEST_ID"
  },
  {
    name: "Buildkite",
    constant: "BUILDKITE",
    env: "BUILDKITE",
    pr: {
      env: "BUILDKITE_PULL_REQUEST",
      ne: "false"
    }
  },
  {
    name: "CircleCI",
    constant: "CIRCLE",
    env: "CIRCLECI",
    pr: "CIRCLE_PULL_REQUEST"
  },
  {
    name: "Cirrus CI",
    constant: "CIRRUS",
    env: "CIRRUS_CI",
    pr: "CIRRUS_PR"
  },
  {
    name: "Codefresh",
    constant: "CODEFRESH",
    env: "CF_BUILD_ID",
    pr: {
      any: ["CF_PULL_REQUEST_NUMBER", "CF_PULL_REQUEST_ID"]
    }
  },
  {
    name: "Codemagic",
    constant: "CODEMAGIC",
    env: "CM_BUILD_ID",
    pr: "CM_PULL_REQUEST"
  },
  {
    name: "Codeship",
    constant: "CODESHIP",
    env: {
      CI_NAME: "codeship"
    }
  },
  {
    name: "Drone",
    constant: "DRONE",
    env: "DRONE",
    pr: {
      DRONE_BUILD_EVENT: "pull_request"
    }
  },
  {
    name: "dsari",
    constant: "DSARI",
    env: "DSARI"
  },
  {
    name: "Earthly",
    constant: "EARTHLY",
    env: "EARTHLY_CI"
  },
  {
    name: "Expo Application Services",
    constant: "EAS",
    env: "EAS_BUILD"
  },
  {
    name: "Gerrit",
    constant: "GERRIT",
    env: "GERRIT_PROJECT"
  },
  {
    name: "Gitea Actions",
    constant: "GITEA_ACTIONS",
    env: "GITEA_ACTIONS"
  },
  {
    name: "GitHub Actions",
    constant: "GITHUB_ACTIONS",
    env: "GITHUB_ACTIONS",
    pr: {
      GITHUB_EVENT_NAME: "pull_request"
    }
  },
  {
    name: "GitLab CI",
    constant: "GITLAB",
    env: "GITLAB_CI",
    pr: "CI_MERGE_REQUEST_ID"
  },
  {
    name: "GoCD",
    constant: "GOCD",
    env: "GO_PIPELINE_LABEL"
  },
  {
    name: "Google Cloud Build",
    constant: "GOOGLE_CLOUD_BUILD",
    env: "BUILDER_OUTPUT"
  },
  {
    name: "Harness CI",
    constant: "HARNESS",
    env: "HARNESS_BUILD_ID"
  },
  {
    name: "Heroku",
    constant: "HEROKU",
    env: {
      env: "NODE",
      includes: "/app/.heroku/node/bin/node"
    }
  },
  {
    name: "Hudson",
    constant: "HUDSON",
    env: "HUDSON_URL"
  },
  {
    name: "Jenkins",
    constant: "JENKINS",
    env: ["JENKINS_URL", "BUILD_ID"],
    pr: {
      any: ["ghprbPullId", "CHANGE_ID"]
    }
  },
  {
    name: "LayerCI",
    constant: "LAYERCI",
    env: "LAYERCI",
    pr: "LAYERCI_PULL_REQUEST"
  },
  {
    name: "Magnum CI",
    constant: "MAGNUM",
    env: "MAGNUM"
  },
  {
    name: "Netlify CI",
    constant: "NETLIFY",
    env: "NETLIFY",
    pr: {
      env: "PULL_REQUEST",
      ne: "false"
    }
  },
  {
    name: "Nevercode",
    constant: "NEVERCODE",
    env: "NEVERCODE",
    pr: {
      env: "NEVERCODE_PULL_REQUEST",
      ne: "false"
    }
  },
  {
    name: "Prow",
    constant: "PROW",
    env: "PROW_JOB_ID"
  },
  {
    name: "ReleaseHub",
    constant: "RELEASEHUB",
    env: "RELEASE_BUILD_ID"
  },
  {
    name: "Render",
    constant: "RENDER",
    env: "RENDER",
    pr: {
      IS_PULL_REQUEST: "true"
    }
  },
  {
    name: "Sail CI",
    constant: "SAIL",
    env: "SAILCI",
    pr: "SAIL_PULL_REQUEST_NUMBER"
  },
  {
    name: "Screwdriver",
    constant: "SCREWDRIVER",
    env: "SCREWDRIVER",
    pr: {
      env: "SD_PULL_REQUEST",
      ne: "false"
    }
  },
  {
    name: "Semaphore",
    constant: "SEMAPHORE",
    env: "SEMAPHORE",
    pr: "PULL_REQUEST_NUMBER"
  },
  {
    name: "Sourcehut",
    constant: "SOURCEHUT",
    env: {
      CI_NAME: "sourcehut"
    }
  },
  {
    name: "Strider CD",
    constant: "STRIDER",
    env: "STRIDER"
  },
  {
    name: "TaskCluster",
    constant: "TASKCLUSTER",
    env: ["TASK_ID", "RUN_ID"]
  },
  {
    name: "TeamCity",
    constant: "TEAMCITY",
    env: "TEAMCITY_VERSION"
  },
  {
    name: "Travis CI",
    constant: "TRAVIS",
    env: "TRAVIS",
    pr: {
      env: "TRAVIS_PULL_REQUEST",
      ne: "false"
    }
  },
  {
    name: "Vela",
    constant: "VELA",
    env: "VELA",
    pr: {
      VELA_PULL_REQUEST: "1"
    }
  },
  {
    name: "Vercel",
    constant: "VERCEL",
    env: {
      any: ["NOW_BUILDER", "VERCEL"]
    },
    pr: "VERCEL_GIT_PULL_REQUEST_ID"
  },
  {
    name: "Visual Studio App Center",
    constant: "APPCENTER",
    env: "APPCENTER_BUILD_ID"
  },
  {
    name: "Woodpecker",
    constant: "WOODPECKER",
    env: {
      CI: "woodpecker"
    },
    pr: {
      CI_BUILD_EVENT: "pull_request"
    }
  },
  {
    name: "Xcode Cloud",
    constant: "XCODE_CLOUD",
    env: "CI_XCODE_PROJECT",
    pr: "CI_PULL_REQUEST_NUMBER"
  },
  {
    name: "Xcode Server",
    constant: "XCODE_SERVER",
    env: "XCS"
  }
];
init(VENDORS);

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const getConfigDir = (name) => {
  const homedir = os__default.homedir();
  const macos = () => path__default.join(homedir, "Library", "Preferences", name);
  const win = () => {
    const { APPDATA = path__default.join(homedir, "AppData", "Roaming") } = process__default.env;
    return path__default.join(APPDATA, name, "Config");
  };
  const linux = () => {
    const { XDG_CONFIG_HOME = path__default.join(homedir, ".config") } = process__default.env;
    return path__default.join(XDG_CONFIG_HOME, name);
  };
  switch (process__default.platform) {
    case "darwin":
      return macos();
    case "win32":
      return win();
    default:
      return linux();
  }
};
class GlobalConfig {
  constructor(project) {
    this.project = project;
    __publicField$1(this, "dir");
    __publicField$1(this, "file");
    __publicField$1(this, "_store");
    this.dir = getConfigDir(this.project.name);
    this.file = path__default.join(this.dir, "config.json");
  }
  get store() {
    if (this._store)
      return this._store;
    this.ensureDir();
    if (fs__default.existsSync(this.file)) {
      this._store = JSON.parse(fs__default.readFileSync(this.file).toString());
    } else {
      const store = {};
      this._store = store;
      this.write();
    }
    return this._store;
  }
  set store(value) {
    this._store = value;
    this.write();
  }
  ensureDir() {
    fs__default.mkdirSync(this.dir, { recursive: true });
  }
  write() {
    fs__default.writeFileSync(this.file, JSON.stringify(this.store, null, "	"));
  }
  clear() {
    this.store = {};
    fs__default.rmSync(this.file, { recursive: true });
  }
  delete(key) {
    this.store[key] = void 0;
    this.write();
    return true;
  }
  get(key) {
    return this.store[key];
  }
  has(key) {
    return typeof this.get(key) !== "undefined";
  }
  set(key, value) {
    this.store[key] = value;
    this.write();
  }
}

if (!("markResourceTiming" in performance) || typeof performance["markResourceTiming"] !== "function") {
  performance["markResourceTiming"] = () => {
  };
}
const MILLION_TELEMETRY_ENDPOINT = "https://telemetry.million.dev/api/v1/record";
const post = async (body) => {
  try {
    const response = await undici.fetch(MILLION_TELEMETRY_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ body }),
      headers: { "content-type": "application/json" }
    });
    return response;
  } catch (error) {
  }
};

const pmFromUserAgent = (userAgent) => {
  const pmSpec = userAgent.split(" ")[0];
  if (!pmSpec)
    return void 0;
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);
  return {
    name: name === "npminstall" ? "cnpm" : name,
    version: pmSpec.substring(separatorPos + 1)
  };
};
const detectPackageManager = () => {
  if (!process.env.npm_config_user_agent) {
    return void 0;
  }
  return pmFromUserAgent(process.env.npm_config_user_agent);
};

const createAnonymousValue = (payload) => {
  if (payload === "") {
    return payload;
  }
  const hash = node_crypto.createHash("sha256");
  hash.update(payload);
  return hash.digest("hex");
};
const getProjectIdFromGit = () => {
  try {
    const originBuffer = node_child_process.execSync(`git rev-list --max-parents=0 HEAD`, {
      timeout: 500,
      stdio: ["ignore", "pipe", "ignore"]
    });
    return String(originBuffer).trim();
  } catch (_) {
    return null;
  }
};
const getProjectId = (isCI) => {
  const projectIdFromGit = getProjectIdFromGit();
  if (projectIdFromGit) {
    return {
      isGit: true,
      anonymousProjectId: createAnonymousValue(projectIdFromGit)
    };
  }
  const cwd = process.cwd();
  const isCwdGeneric = (cwd.match(/[/|\\]/g) || []).length === 1;
  if (isCI || isCwdGeneric) {
    return {
      isGit: false,
      anonymousProjectId: void 0
    };
  }
  return {
    isGit: false,
    anonymousProjectId: createAnonymousValue(cwd)
  };
};
const getProjectInfo = (isCI) => {
  const projectId = getProjectId(isCI);
  const packageManager = detectPackageManager();
  return {
    ...projectId,
    packageManager: packageManager?.name,
    packageManagerVersion: packageManager?.version
  };
};

let isDockerCached;
const hasDockerEnv = () => {
  try {
    fs__default.statSync("/.dockerenv");
    return true;
  } catch {
    return false;
  }
};
const hasDockerCGroup = () => {
  try {
    return fs__default.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
  } catch {
    return false;
  }
};
const isDocker = () => {
  if (isDockerCached === void 0) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup();
  }
  return isDockerCached;
};

let cachedResult;
const hasContainerEnv = () => {
  try {
    fs__default.statSync("/run/.containerenv");
    return true;
  } catch {
    return false;
  }
};
const isInsideContainer = () => {
  if (cachedResult === void 0) {
    cachedResult = hasContainerEnv() || isDocker();
  }
  return cachedResult;
};

const isWSL = () => {
  if (process__default.platform !== "linux") {
    return false;
  }
  if (os__default.release().toLowerCase().includes("microsoft")) {
    if (isInsideContainer()) {
      return false;
    }
    return true;
  }
  try {
    return fs__default.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isInsideContainer() : false;
  } catch {
    return false;
  }
};

let meta;
const getSystemInfo = () => {
  if (meta) {
    return meta;
  }
  const cpus = os__default.cpus();
  meta = {
    // Version information
    nodeVersion: process.version.replace(/^v?/, ""),
    // Software information
    systemPlatform: os__default.platform(),
    systemRelease: os__default.release(),
    systemArchitecture: os__default.arch(),
    // Machine information
    cpuCount: cpus.length,
    cpuModel: cpus.length ? cpus[0].model : null,
    cpuSpeed: cpus.length ? cpus[0].speed : null,
    memoryInMb: Math.trunc(os__default.totalmem() / Math.pow(1024, 2)),
    // Environment information
    isDocker: isDocker(),
    isWSL: isWSL(),
    isCI,
    ciName: getCI()
  };
  return meta;
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class MillionTelemetry {
  constructor(TELEMETRY_DISABLED = false) {
    this.TELEMETRY_DISABLED = TELEMETRY_DISABLED;
    __publicField(this, "_anonymousSessionId");
    __publicField(this, "_anonymousProjectInfo");
    __publicField(this, "config", new GlobalConfig({ name: "million" }));
    __publicField(this, "isCI", isCI);
    __publicField(this, "alreadyShowedImprovement", false);
    this.TELEMETRY_DISABLED = TELEMETRY_DISABLED;
  }
  getConfigWithFallback(key, getValue) {
    const currentValue = this.config.get(key);
    if (currentValue !== void 0) {
      return currentValue;
    }
    const newValue = getValue();
    this.config.set(key, newValue);
    return newValue;
  }
  get enabled() {
    return this.getConfigWithFallback("telemetry_enabled", () => true);
  }
  get anonymousId() {
    return this.getConfigWithFallback(
      "telemetry_anonymousId",
      () => node_crypto.randomBytes(16).toString("hex")
    );
  }
  get anonymousSessionId() {
    this._anonymousSessionId = this._anonymousSessionId || node_crypto.randomBytes(16).toString("hex");
    return this._anonymousSessionId;
  }
  get anonymousProjectInfo() {
    this._anonymousProjectInfo = this._anonymousProjectInfo || getProjectInfo(this.isCI);
    return this._anonymousProjectInfo;
  }
  get isDisabled() {
    if (this.TELEMETRY_DISABLED) {
      return true;
    }
    return !this.enabled;
  }
  setEnabled(value) {
    this.config.set("telemetry_enabled", value);
  }
  clear() {
    this.config.clear();
  }
  showWrapped() {
    if (this.alreadyShowedImprovement)
      return;
    this.alreadyShowedImprovement = true;
    setTimeout(() => {
      console.log(
        ` \u{1F381} Million Wrapped: ${colors.cyan(
          `https://million.dev/wrapped/${this.anonymousSessionId}`
        )}`
      );
    }, 3e3);
  }
  record({ event, payload }) {
    if (this.isDisabled) {
      return Promise.resolve();
    }
    const meta = {
      system: getSystemInfo(),
      project: this.anonymousProjectInfo
    };
    if (event === "improvement") {
      this.showWrapped();
    }
    return post({
      event,
      anonymousId: meta.system.isCI ? this.anonymousId : `CI.${meta.system.ciName || "UNKNOWN"}`,
      anonymousSessionId: this.anonymousSessionId,
      payload,
      meta
    });
  }
}

const DEFAULT_INCLUDE = "**/*.{jsx,tsx}";
const DEFAULT_EXCLUDE = "node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}";
let ssr = false;
async function compile(id, code, options, telemetryInstance, isServer) {
  if (isServer) {
    ssr = true;
  }
  displayIntro(options);
  const plugins = [
    "jsx",
    // import { example } from 'example' with { example: true };
    "importAttributes",
    // () => throw example
    "throwExpressions",
    // You know what this is
    "decorators",
    // const { #example: example } = this;
    "destructuringPrivate",
    // using example = myExample()
    "explicitResourceManagement"
  ];
  if (/\.[mc]?tsx?$/i.test(id)) {
    plugins.push("typescript");
  }
  const result = await core.transformAsync(code, {
    plugins: [
      [
        babel,
        {
          telemetry: telemetryInstance,
          log: options.log,
          server: ssr,
          hmr: options.hmr,
          auto: options.auto,
          rsc: options.rsc
        }
      ]
    ],
    // plugins: [[babel, options]],
    parserOpts: { plugins },
    filename: id,
    ast: false,
    sourceFileName: id,
    sourceMaps: true,
    configFile: false,
    babelrc: false
  });
  if (!result) {
    throw new Error("invariant");
  }
  return { code: result.code || "", map: result.map };
}
const unplugin = unplugin$1.createUnplugin((options = {}, meta) => {
  if (!options.log) {
    options.log = true;
  }
  const filter = pluginutils.createFilter(
    options.filter?.include || DEFAULT_INCLUDE,
    options.filter?.exclude || DEFAULT_EXCLUDE
  );
  if (options.mode?.endsWith("-server")) {
    options.server = true;
    options.mode = "react";
  }
  if (options.mode?.startsWith("preact")) {
    throw new Error(
      "Preact is no longer maintained. Downgrade to a lower version (<= 2.x.x) for support"
    );
  }
  const telemetryInstance = new MillionTelemetry(options.telemetry);
  void telemetryInstance.record({
    event: "compile",
    payload: {
      framework: meta.framework,
      mode: options.mode,
      server: options.server,
      hmr: options.hmr,
      rsc: options.rsc,
      log: options.log,
      auto: options.auto
      // optimize: options.optimize,
    }
  });
  return {
    enforce: "pre",
    name: "million",
    transformInclude(id) {
      return filter(id);
    },
    async transform(code, id) {
      try {
        const result = await compile(
          id,
          code,
          options,
          telemetryInstance,
          options.server
        );
        return {
          code: result.code || "",
          map: result.map
        };
      } catch (err) {
        console.error(err);
        return { code: "" };
      }
    },
    vite: {
      configResolved(config) {
        repushPlugin(config.plugins, "million", [
          // https://github.com/withastro/astro/blob/main/packages/astro/src/vite-plugin-jsx/index.ts#L173
          "astro:jsx",
          // https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react
          "vite:react-babel",
          "vite:react-jsx",
          // https://github.com/preactjs/preset-vite/blob/main/src/index.ts
          "vite:preact-jsx",
          // https://github.com/vitejs/vite-plugin-react-swc/blob/main/src/index.ts
          "vite:react-swc"
        ]);
        options.hmr = config.env.DEV;
      },
      async transform(code, id, opts) {
        try {
          if (filter(id)) {
            const result = await compile(
              id,
              code,
              options,
              telemetryInstance,
              opts?.ssr
            );
            return {
              code: result.code || "",
              map: result.map
            };
          }
          return null;
        } catch (_err) {
          return null;
        }
      }
    }
  };
});
const repushPlugin = (plugins, pluginName, pluginNames) => {
  const namesSet = new Set(pluginNames);
  let baseIndex = -1;
  let targetIndex = -1;
  let targetPlugin;
  for (let i = 0, len = plugins.length; i < len; i += 1) {
    const current = plugins[i];
    if (namesSet.has(current.name) && baseIndex === -1) {
      baseIndex = i;
    }
    if (current.name === pluginName) {
      targetIndex = i;
      targetPlugin = current;
    }
  }
  if (baseIndex !== -1 && targetIndex !== -1 && baseIndex < targetIndex) {
    plugins.splice(targetIndex, 1);
    plugins.splice(baseIndex, 0, targetPlugin);
  }
};

const vite = unplugin.vite;
const webpack = unplugin.webpack;
const rollup = unplugin.rollup;
const rspack = unplugin.rspack;
const esbuild = unplugin.esbuild;
const next = (nextConfig = {}, overrideOptions = {}) => {
  const millionConfig = {
    mode: "react",
    ...overrideOptions
  };
  return {
    ...nextConfig,
    webpack(config, webpackOptions) {
      if (millionConfig.rsc === void 0) {
        millionConfig.rsc = nextConfig.appDir ?? fs.existsSync(`${webpackOptions.dir}${nextConfig.basePath || ""}/app`);
      }
      config.plugins.unshift(
        webpack({
          server: webpackOptions.isServer,
          log: webpackOptions.isServer,
          ...millionConfig
        })
      );
      if (typeof nextConfig.webpack === "function") {
        return nextConfig.webpack(config, webpackOptions);
      }
      return config;
    }
  };
};
const index = {
  vite,
  webpack,
  rollup,
  rspack,
  esbuild,
  next,
  unplugin,
  babel
};

exports.babel = babel;
exports.default = index;
exports.esbuild = esbuild;
exports.next = next;
exports.rollup = rollup;
exports.rspack = rspack;
exports.vite = vite;
exports.webpack = webpack;
