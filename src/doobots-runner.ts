#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Request } from "./doobots.js";

export function loadInput(filePath: string): Request {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return new Request(parsed.data || {}, parsed.files || []);
}

async function main() {
  const cwd = process.cwd();
  const TIMEOUT = process.env.DOOBOTS_TIMEOUT ? parseInt(process.env.DOOBOTS_TIMEOUT) : 15 * 60000;

  let entryFile: string | null = null;
  const candidates = [path.join(cwd, "main.js"), path.join(cwd, "dist", "main.js")];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      entryFile = candidate;
      break;
    }
  }

  if (!entryFile) {
    console.error("Não foi possível encontrar o arquivo de entrada 'main.js' ou 'dist/main.js'.");
    process.exit(2);
  }

  let inputFile: string | null = null;
  const inputCandidates = [path.join(cwd, "input.json"), path.join(cwd, "dist", "input.json")];
  for (const candidate of inputCandidates) {
    if (fs.existsSync(candidate)) {
      inputFile = candidate;
      break;
    }
  }

  if (!inputFile) {
    console.error("Não foi possível encontrar o arquivo de entrada 'input.json' ou 'dist/input.json'.");
    process.exit(2);
  }

  try {
    const mod = await import("file://" + entryFile);
    if (!mod || typeof mod.main !== "function") {
      console.error("O módulo importado não possui uma função 'main' exportada.");
      process.exit(3);
    }

    const request = loadInput(inputFile);

    const promise = Promise.resolve(mod.main(request as Request));
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), TIMEOUT)
    );

    const result = await Promise.race([promise, timeout]);
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error("Erro ao executar a função:", err);
    process.exit(1);
  }
}

main();
