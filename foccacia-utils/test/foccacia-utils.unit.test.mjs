import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { initUtils } from "../src/foccacia-utils.mjs";

describe("Utils", () => {
  const utils = initUtils();

  describe("toTrimmedString", () => {
    it("deve remover espaços no início e fim", () => {
      assert.strictEqual(utils.toTrimmedString("  teste  "), "teste");
    });

    it("deve retornar null para string vazia", () => {
      assert.strictEqual(utils.toTrimmedString("   "), null);
    });

    it("deve retornar null para null", () => {
      assert.strictEqual(utils.toTrimmedString(null), null);
    });

    it("deve converter número para string", () => {
      assert.strictEqual(utils.toTrimmedString(123), "123");
    });
  });

  describe("toYear", () => {
    it("deve aceitar ano com 4 dígitos", () => {
      assert.strictEqual(utils.toYear(2024), 2024);
    });

    it("deve rejeitar ano com 2 dígitos", () => {
      assert.strictEqual(utils.toYear(99), null);
    });

    it("deve aceitar string com 4 dígitos", () => {
      assert.strictEqual(utils.toYear("2024"), 2024);
    });

    it("deve rejeitar texto", () => {
      assert.strictEqual(utils.toYear("abc"), null);
    });
  });

  describe("areSameId", () => {
    it("deve retornar true para ids iguais", () => {
      assert.strictEqual(utils.areSameId("123", "123"), true);
    });

    it("deve retornar false para ids diferentes", () => {
      assert.strictEqual(utils.areSameId("123", "456"), false);
    });

    it("deve ignorar espaços", () => {
      assert.strictEqual(utils.areSameId("  123  ", "123"), true);
    });

    it("deve retornar false se um id for null", () => {
      assert.strictEqual(utils.areSameId(null, "123"), false);
    });
  });

  describe("toTrimmedStringMinLen", () => {
    it("deve aceitar string com tamanho mínimo", () => {
      assert.strictEqual(utils.toTrimmedStringMinLen("abc", 3), "abc");
    });

    it("deve rejeitar string menor que mínimo", () => {
      assert.strictEqual(utils.toTrimmedStringMinLen("ab", 3), null);
    });
  });

  describe("getYearFromDate", () => {
    it("deve extrair ano de data válida", () => {
      assert.strictEqual(utils.getYearFromDate("2024-01-15"), 2024);
    });

    it("deve retornar null para data inválida", () => {
      assert.strictEqual(utils.getYearFromDate("data-errada"), null);
    });
  });

  it("json-utils: writeJson/readJson roundtrip", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "foccacia-"));
    const file = path.join(dir, "x.json");

    const obj = { a: 1, b: { c: "d" } };

    await utils.writeJson({ filePath: file, data: obj });

    const back = await utils.readJson(file);

    assert.deepEqual(back, obj);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("log-utils: escreve no console (smoke)", () => {
    const prev = console.log;

    const lines = [];
    console.log = (...args) => lines.push(args.join(" "));

    utils.logInfo("hello", "ctx");
    console.log = prev;

    assert.ok(lines.some((l) => l.includes("hello")));
  });
});
