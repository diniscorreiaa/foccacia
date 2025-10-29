import assert from "node:assert";
import { logInfo, logSuccess, logError } from "../src/log-utils.mjs";

describe("Log Utils – testes para log-utils.mjs", function () {
  let originalLog;
  let originalError;
  let logged;
  let errored;

  before(function () {
    originalLog = console.log;
    originalError = console.error;
  });

  after(function () {
    console.log = originalLog;
    console.error = originalError;
  });

  beforeEach(function () {
    logged = [];
    errored = [];
    console.log = (...args) => logged.push(args);
    console.error = (...args) => errored.push(args);
  });

  it("logInfo escreve mensagem formatada no console.log", function () {
    logInfo("teste");
    assert.strictEqual(logged.length, 1);
    assert.match(
      String(logged[0][0]),
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z ℹ️ Info: teste$/
    );
  });

  it("logSuccess escreve mensagem formatada no console.log", function () {
    logSuccess("ok");
    assert.strictEqual(logged.length, 1);
    assert.match(
      String(logged[0][0]),
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z ✅ Sucesso: ok$/
    );
  });

  it("logError escreve mensagem formatada no console.error e passa a stack como segundo argumento", function () {
    const err = new Error("boom");
    logError("falha", err);
    assert.strictEqual(errored.length, 1);
    assert.match(
      String(errored[0][0]),
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z ❌ Erro: falha$/
    );
    assert.strictEqual(typeof errored[0][1], "string");
    assert.ok(errored[0][1].includes("Error: boom"));
  });
});
