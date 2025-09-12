#!/usr/bin/env node

import fs from "fs";
import path from "path";
import archiver from "archiver";

async function copySrcToDist(srcDir: string, distDir: string) {
  await fs.promises.cp(srcDir, distDir, {
    recursive: true,
    force: true
  });
}

async function main() {
  const cwd = process.cwd();
  const packageJson = path.join(cwd, "package.json");
  const packageLockJson = path.join(cwd, "package-lock.json");
  const distDir = path.join(cwd, "dist");
  const srcDir = path.join(cwd, "src");
  const tsConfigPath = path.join(cwd, "tsconfig.json");

  if (!fs.existsSync(packageJson) || !fs.statSync(packageJson).isFile()) {
    console.error("❌ Não encontrei os arquivos package.json e package-lock.json na raiz do projeto.");
    process.exit(1);
  }

  let isTypeScriptProject = fs.existsSync(tsConfigPath);
  if (!isTypeScriptProject) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
    isTypeScriptProject = Boolean(pkg.devDependencies?.typescript || pkg.dependencies?.typescript);
  }

  if (!isTypeScriptProject && (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory())) {
    console.log("📂 Pasta 'dist' não existe. Criando..");
    fs.mkdirSync(distDir);
  }

  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    console.error("❌ A pasta 'dist' não existe ou não é um diretório.");
    process.exit(1);
  }

  fs.copyFileSync(packageJson, path.join(distDir, "package.json"));
  fs.copyFileSync(packageLockJson, path.join(distDir, "package-lock.json"));
  console.log("✅ Copiados package.json e package-lock.json para 'dist'.");

  if (!isTypeScriptProject && fs.existsSync(srcDir)) {
    console.log("📂 Projeto JavaScript detectado. Copiando conteúdo de 'src' para 'dist'...");
    await copySrcToDist(srcDir, distDir);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  const zipName = `${pkg.name || "package"}-${pkg.version}.zip`;
  const zipPath = path.join(cwd, zipName);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(`✅ Pacote gerado: ${zipPath} (${archive.pointer()} bytes)`);
  });

  archive.on("error", (err) => {
    console.error("Erro ao criar o pacote:", err);
    process.exit(1);
  });

  archive.pipe(output);
  archive.directory(distDir, false);

  await archive.finalize();
}

main();
