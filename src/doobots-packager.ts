#!/usr/bin/env node

import fs from "fs";
import path from "path";
import yazl from "yazl";

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

  try {
    await zipDirectory(distDir, zipPath);

    const size = fs.statSync(zipPath).size;
    console.log(`✅ Pacote gerado: ${zipPath} (${size} bytes)`);
  } catch (err) {
    console.error("Erro ao criar o pacote:", err);
    process.exit(1);
  }
}

function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const zipfile = new yazl.ZipFile();

    function addDir(dir: string, basePath = "") {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativePath = path.join(basePath, file);

        if (fs.statSync(fullPath).isDirectory()) {
          addDir(fullPath, relativePath);
        } else {
          zipfile.addFile(fullPath, relativePath);
        }
      }
    }

    addDir(sourceDir);

    zipfile.end();

    zipfile.outputStream
      .pipe(fs.createWriteStream(outPath))
      .on("close", resolve)
      .on("error", reject);
  });
}

main();
