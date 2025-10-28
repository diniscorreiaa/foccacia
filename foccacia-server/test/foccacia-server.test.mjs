import assert from "assert";
import { hello } from "../src/foccacia-server.mjs";

describe("hello()", () => {
  it('deve retornar "hello world" por defeito', () => {
    assert.strictEqual(hello(), "hello world");
  });

  it("deve incluir o nome passado", () => {
    assert.strictEqual(hello("Tiago"), "hello Tiago");
  });
});

// TODO: implement foccacia-server tests
