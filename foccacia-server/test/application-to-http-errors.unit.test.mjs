import assert from "node:assert/strict";
import { initSendApplicationError } from "../src/application-to-http-errors.mjs";
import errors, { ERROR_CODES } from "foccacia-errors";

describe("application-to-http-errors — unit", () => {
  function makeReqApi(path = "/api/x") {
    return {
      method: "GET",
      path,
      accepts: (t) => (t === "json" ? "json" : false),
    };
  }

  function makeReqSite(path = "/groups") {
    return {
      method: "GET",
      path,
      accepts: (t) => (t === "html" ? "html" : false),
    };
  }

  function makeRes() {
    const out = { status: null, json: null, view: null, model: null };
    const res = {
      status(code) {
        out.status = code;
        return res;
      },
      json(body) {
        out.json = body;
        return res;
      },
      render(view, model) {
        out.view = view;
        out.model = model;
        return res;
      },
    };
    return { res, out };
  }

  it("API: UNAUTHORIZED -> 401 + json body", () => {
    const mw = initSendApplicationError({
      ERROR_CODES,
      logError: () => {},
    });

    const { res, out } = makeRes();
    const req = makeReqApi("/api/groups");

    mw(errors.UNAUTHORIZED("Invalid token"), req, res, () => {});

    assert.equal(out.status, 401);
    assert.ok(out.json); // existe body json
    assert.equal(typeof out.json, "object");

    const serialized = JSON.stringify(out.json);
    assert.ok(
      serialized.includes("Unauthorized") || serialized.includes("Invalid")
    );
  });

  it("SITE: NOT_FOUND -> 404 + render http-errors", () => {
    const mw = initSendApplicationError({
      ERROR_CODES,
      logError: () => {},
    });

    const { res, out } = makeRes();
    const req = makeReqSite("/groups");

    mw(errors.NOT_FOUND("Nope"), req, res, () => {});

    assert.equal(out.status, 404);
    assert.equal(out.view, "http-errors"); // ✅ é o vosso template real
    assert.ok(out.model);
  });
});
