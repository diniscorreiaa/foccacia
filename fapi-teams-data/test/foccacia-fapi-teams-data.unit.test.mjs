import assert from "node:assert/strict";

import { initFapiTeams } from "../src/fapi-teams-data.mjs";
import { initDomainModel } from "foccacia-domain-model";

describe("FAPI Teams Data — unit", () => {
  const domainModel = initDomainModel();

  function makeUtils() {
    const calls = { read: 0, write: 0 };
    const store = new Map();

    return {
      calls,

      fileExists: async (filePath) => store.has(filePath),

      readJson: async (filePath) => {
        calls.read++;
        return store.get(filePath);
      },

      writeJson: async ({ filePath, data }) => {
        calls.write++;
        store.set(filePath, data);
        return true;
      },

      getHeadersFilePath: () => "/tmp/headers.json",
      getCompetitionsFilePath: () => "/tmp/competitions.json",

      // o módulo chama isto com (code)
      getSeasonsYearsFilePath: (code) => `/tmp/seasons-${code}.json`,

      getCompetitionTeamsFilePath: ({ code, season }) =>
        `/tmp/teams-${code}-${season}.json`,

      getYearFromDate: (date) => (date ? new Date(date).getFullYear() : null),
      getAgeFromDate: () => 20,

      logInfo: () => {},
      logError: () => {},
      logSuccess: () => {},
    };
  }

  function makeFetchMock(handler) {
    return async (url, opts) => handler(url, opts);
  }

  it("cache hit: não chama fetch", async () => {
    const utils = makeUtils();
    await utils.writeJson({
      filePath: utils.getHeadersFilePath(),
      data: { "X-Auth-Token": "t" },
    });
    await utils.writeJson({
      filePath: utils.getCompetitionsFilePath(),
      data: { competitions: [{ code: "PL", name: "Premier League" }] },
    });

    const prevFetch = globalThis.fetch;
    globalThis.fetch = makeFetchMock(() => {
      throw new Error("fetch não devia ser chamado");
    });

    const fapi = initFapiTeams({ domainModel: domainModel, utils });
    const competitions = await fapi.getCompetitions();

    globalThis.fetch = prevFetch;

    assert.equal(competitions.length, 1);
    assert.equal(competitions[0].code, "PL");
  });

  it("cache miss: chama fetch e escreve cache", async () => {
    const utils = makeUtils();
    await utils.writeJson({
      filePath: utils.getHeadersFilePath(),
      data: { "X-Auth-Token": "t" },
    });

    const prevFetch = globalThis.fetch;
    globalThis.fetch = makeFetchMock(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        competitions: [{ code: "PL", name: "Premier League" }],
      }),
    }));

    const fapi = initFapiTeams({ domainModel: domainModel, utils });
    const comps = await fapi.getCompetitions();

    globalThis.fetch = prevFetch;

    assert.equal(comps.length, 1);
    assert.ok(utils.calls.write >= 1);
  });

  it("rate limit (429): devolve false", async () => {
    const utils = makeUtils();
    await utils.writeJson({
      filePath: utils.getHeadersFilePath(),
      data: { "X-Auth-Token": "t" },
    });

    const prevFetch = globalThis.fetch;
    globalThis.fetch = makeFetchMock(async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
    }));

    const fapi = initFapiTeams({ domainModel: domainModel, utils });
    const res = await fapi.getCompetitions();

    globalThis.fetch = prevFetch;

    assert.equal(res, false);
  });
});
