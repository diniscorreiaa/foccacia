import assert from "node:assert/strict";
import { initDataElasticSearch } from "../src/foccacia-data-elasticsearch.mjs";
import { initDomainModel } from "foccacia-domain-model";
import { initUtils } from "foccacia-utils";

describe("Data ElasticSearch — unit", () => {
  const domainModel = initDomainModel();
  const utils = initUtils();

  it("init: cria índices (2 PUTs)", async () => {
    const calls = [];
    const prevFetch = globalThis.fetch;

    globalThis.fetch = async (url, opts = {}) => {
      calls.push({ url, method: opts.method ?? "GET" });
      return { ok: true, status: 200, json: async () => ({}) };
    };

    initDataElasticSearch({ domainModel: domainModel, utils });

    globalThis.fetch = prevFetch;

    assert.ok(
      calls.some(
        (call) =>
          call.method === "PUT" && String(call.url).includes("foccacia-users")
      )
    );
    assert.ok(
      calls.some(
        (call) =>
          call.method === "PUT" && String(call.url).includes("foccacia-groups")
      )
    );
  });

  it("createUser: faz search e cria doc", async () => {
    const prevFetch = globalThis.fetch;
    const seen = [];

    globalThis.fetch = async (url, opts = {}) => {
      seen.push({ url, opts });

      if (String(url).includes("/_search")) {
        const body = JSON.parse(opts.body);
        assert.ok(body.query.term["username.keyword"]);
        return {
          ok: true,
          status: 200,
          json: async () => ({ hits: { hits: [] } }),
        };
      }

      if (String(url).includes("/_doc")) {
        return { ok: true, status: 201, json: async () => ({ _id: "u1" }) };
      }

      return { ok: true, status: 200, json: async () => ({}) };
    };

    const data = initDataElasticSearch({ domainModel: domainModel, utils });
    const user = await data.createUser({ username: "joao", password: "123" });

    globalThis.fetch = prevFetch;

    assert.equal(user.id, "u1");
    assert.equal(user.username, "joao");
  });
});
