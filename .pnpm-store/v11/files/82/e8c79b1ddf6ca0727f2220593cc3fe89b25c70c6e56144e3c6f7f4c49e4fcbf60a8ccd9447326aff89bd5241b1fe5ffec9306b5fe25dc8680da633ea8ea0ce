// src/index.ts
import { createHash } from "crypto";
import { resolve } from "path";
import { promises as fs } from "fs";
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
  const resolveInOutDir = (path) => resolve(outDir, path);
  manifestPath = resolveInOutDir(manifestPath);
  const manifest = await fs.readFile(manifestPath, "utf-8").then(JSON.parse, () => void 0);
  if (manifest) {
    await Promise.all(Object.values(manifest).map(async (chunk) => {
      chunk.integrity = integrityForAsset(await fs.readFile(resolveInOutDir(chunk.file)), algorithms);
    }));
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }
}
function integrityForAsset(source, algorithms) {
  return algorithms.map((algorithm) => calculateIntegrityHash(source, algorithm)).join(" ");
}
function calculateIntegrityHash(source, algorithm) {
  const hash = createHash(algorithm).update(source).digest().toString("base64");
  return `${algorithm.toLowerCase()}-${hash}`;
}
export {
  calculateIntegrityHash,
  manifestSRI as default
};
