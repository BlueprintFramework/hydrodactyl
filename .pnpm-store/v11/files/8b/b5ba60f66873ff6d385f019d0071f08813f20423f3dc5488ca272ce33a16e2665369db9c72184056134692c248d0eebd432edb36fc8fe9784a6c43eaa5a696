"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  calculateIntegrityHash: () => calculateIntegrityHash,
  default: () => manifestSRI
});
module.exports = __toCommonJS(src_exports);
var import_crypto = require("crypto");
var import_path = require("path");
var import_fs = require("fs");
function manifestSRI(options = {}) {
  const {
    algorithms = ["sha384"],
    manifestPaths = [".vite/manifest.json", ".vite/manifest-assets.json", "manifest.json", "manifest-assets.json"]
  } = options;
  return {
    name: "vite-plugin-manifest-sri",
    apply: "build",
    enforce: "post",
    async writeBundle({ dir }) {
      await Promise.all(manifestPaths.map((path) => augmentManifest(path, algorithms, dir)));
    }
  };
}
async function augmentManifest(manifestPath, algorithms, outDir) {
  const resolveInOutDir = (path) => (0, import_path.resolve)(outDir, path);
  manifestPath = resolveInOutDir(manifestPath);
  const manifest = await import_fs.promises.readFile(manifestPath, "utf-8").then(JSON.parse, () => void 0);
  if (manifest) {
    await Promise.all(Object.values(manifest).map(async (chunk) => {
      chunk.integrity = integrityForAsset(await import_fs.promises.readFile(resolveInOutDir(chunk.file)), algorithms);
    }));
    await import_fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }
}
function integrityForAsset(source, algorithms) {
  return algorithms.map((algorithm) => calculateIntegrityHash(source, algorithm)).join(" ");
}
function calculateIntegrityHash(source, algorithm) {
  const hash = (0, import_crypto.createHash)(algorithm).update(source).digest().toString("base64");
  return `${algorithm.toLowerCase()}-${hash}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateIntegrityHash
});
