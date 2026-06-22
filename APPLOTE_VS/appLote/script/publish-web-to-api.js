const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const distDir = path.join(appDir, "dist");
const apiWebRoot = path.resolve(appDir, "..", "..", "APILote", "APILote", "wwwroot");
const expoCli = path.join(appDir, "node_modules", "expo", "bin", "cli");

// Genera una exportación nueva para evitar publicar recursos web desactualizados.
const build = spawnSync(
  process.execPath,
  [expoCli, "export", "--platform", "web", "--output-dir", "dist"],
  { cwd: appDir, env: process.env, stdio: "inherit" },
);

if (build.error) {
  console.error(`No se pudo iniciar la compilación web: ${build.error.message}`);
  process.exit(1);
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// Copia encima de wwwroot sin vaciarlo para preservar uploads y archivos del API.
fs.mkdirSync(apiWebRoot, { recursive: true });
fs.cpSync(distDir, apiWebRoot, { recursive: true, force: true });

console.log(`Web lista para publicar con ASP.NET en: ${apiWebRoot}`);
