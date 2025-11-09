import assert from "node:assert";
import fs from "fs";
import path from "path";
import {
  fileExists,
  getTeamPlayersFilePath,
  getHeadersFilePath,
  getTeamsIdsFilePath,
  getDirName,
  ROOT_DIR,
} from "../src/io-utils.mjs";

describe("IO Utils – testes para io-utils.mjs (usar `docs/output`)", function () {
  const docsOutput = path.join(ROOT_DIR, "docs", "output");
  const docsInput = path.join(ROOT_DIR, "docs", "input");
  const tempFile = path.join(docsOutput, "ioutils_temp.txt");

  before(function () {
    assert.ok(
      fs.existsSync(docsOutput) && fs.statSync(docsOutput).isDirectory(),
      `Falta a pasta \`${docsOutput}\``
    );
  });

  after(function () {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
  });

  it("getTeamPlayersFilePath devolve caminho em `docs/output`", function () {
    const expected = path.join(docsOutput, "team-42-players.json");
    assert.strictEqual(getTeamPlayersFilePath(42), expected);
  });

  it("getHeadersFilePath e getTeamsIdsFilePath apontam para `docs/input`", function () {
    const expectedHeaders = path.join(docsInput, "headers.private.json");
    const expectedTeams = path.join(docsInput, "teams-ids.json");
    assert.strictEqual(getHeadersFilePath(), expectedHeaders);
    assert.strictEqual(getTeamsIdsFilePath(), expectedTeams);
  });

  it("getDirName devolve a diretoria do ficheiro", function () {
    const file = path.join(docsOutput, "team-1-players.json"); // relativo
    assert.strictEqual(getDirName(file), docsOutput);
  });

  it("fileExists detecta ficheiro existente e inexistente", function () {
    fs.writeFileSync(tempFile, "temp", "utf8");
    try {
      assert.strictEqual(fileExists(tempFile), true);
    } finally {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
    assert.strictEqual(fileExists(tempFile), false);
  });
});
