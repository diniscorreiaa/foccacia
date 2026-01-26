import assert from "node:assert/strict";

import errors from "../src/errors.mjs";

describe("Errors", () => {
  it("deve criar erro INVALID_DATA", () => {
    const err = errors.INVALID_DATA("dados errados");
    assert.strictEqual(err.code, 1);
    assert.strictEqual(err.message, "dados errados");
  });

  it("deve criar erro UNAUTHORIZED", () => {
    const err = errors.UNAUTHORIZED("nao autorizado");
    assert.strictEqual(err.code, 2);
    assert.strictEqual(err.message, "nao autorizado");
  });

  it("deve criar erro NOT_FOUND", () => {
    const err = errors.NOT_FOUND("nao existe");
    assert.strictEqual(err.code, 3);
  });

  it("deve criar erro FORBIDDEN", () => {
    const err = errors.FORBIDDEN("proibido");
    assert.strictEqual(err.code, 4);
  });

  it("deve criar erro TOO_MANY_REQUESTS", () => {
    const err = errors.TOO_MANY_REQUESTS("muitos pedidos");
    assert.strictEqual(err.code, 5);
  });

  it("deve criar erro UNPROCESSABLE", () => {
    const err = errors.UNPROCESSABLE("nao processavel");
    assert.strictEqual(err.code, 6);
  });

  it("deve criar erro BAD_GATEWAY", () => {
    const err = errors.BAD_GATEWAY("erro interno");
    assert.strictEqual(err.code, 7);
  });

  it("deve criar erro BAD_GATEWAY", () => {
    const err = errors.BAD_GATEWAY("resposta invalida");
    assert.strictEqual(err.code, 7);
  });

  it("deve criar erro IO_Error", () => {
    const err = errors.IO_ERROR("erro de input/output");
    assert.strictEqual(err.code, 8);
  });

  it("deve criar erro Unexpected", () => {
    const err = errors.UNEXPECTED("erro interno");
    assert.strictEqual(err.code, 9);
  });

  it("deve criar erro Not_Implemented", () => {
    const err = errors.NOT_IMPLEMENTED("funcionalidade nao implementada");
    assert.strictEqual(err.code, 10);
  });
});
