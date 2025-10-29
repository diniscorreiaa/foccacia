import assert from "node:assert";
import fs from "fs";
import path from "path";
import { readJson, writeJson } from "../src/json-utils.mjs";
import { ROOT_DIR } from "../src/io-utils.mjs";

describe("Using async/await : json-utils (usar `docs/output`)", function () {
  const docsOutput = path.join(ROOT_DIR, "docs", "output");
  const outputFile = path.join(docsOutput, "test-write-async.json");
  const nestedOutputFile = path.join(
    docsOutput,
    "test-nested-async",
    "dir",
    "nested.json"
  );

  before(function () {
    assert.ok(
      fs.existsSync(docsOutput) && fs.statSync(docsOutput).isDirectory(),
      `Falta a pasta \`${docsOutput}\``
    );
  });

  after(function () {
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch {}
    try {
      if (fs.existsSync(nestedOutputFile)) fs.unlinkSync(nestedOutputFile);
    } catch {}
    try {
      if (fs.existsSync(path.join(docsOutput, "test-nested-async", "dir")))
        fs.rmSync(path.join(docsOutput, "test-nested-async", "dir"), {
          recursive: true,
          force: true,
        });
    } catch {}
    try {
      if (fs.existsSync(path.join(docsOutput, "test-nested-async")))
        fs.rmSync(path.join(docsOutput, "test-nested-async"), {
          recursive: true,
          force: true,
        });
    } catch {}
  });

  it("writeJson deve escrever ficheiro em `docs/output`", async function () {
    const data = { hello: "world" };
    const ret = await writeJson(data, outputFile);

    assert.deepStrictEqual(ret, data);
    assert.ok(fs.existsSync(outputFile), "ficheiro de output deve existir");
    const content = fs.readFileSync(outputFile, "utf8");
    assert.deepStrictEqual(JSON.parse(content), data);
  });

  it("writeJson cria pastas intermédias quando o caminho é profundo", async function () {
    if (fs.existsSync(path.join(docsOutput, "test-nested-async")))
      fs.rmSync(path.join(docsOutput, "test-nested-async"), {
        recursive: true,
        force: true,
      });

    const data = { deep: true };
    const ret = await writeJson(data, nestedOutputFile);

    assert.deepStrictEqual(ret, data);
    assert.ok(fs.existsSync(nestedOutputFile), "ficheiro nested deve existir");
    const content = fs.readFileSync(nestedOutputFile, "utf8");
    assert.deepStrictEqual(JSON.parse(content), data);
  });

  it("readJson lê corretamente ficheiro escrito em `docs/output`", async function () {
    const data = { read: true };
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");

    const result = await readJson(outputFile);
    assert.deepStrictEqual(result, data);
  });
});
