import assert from "node:assert/strict";

import { initWebApi } from "../src/foccacia-web-api.mjs";
import { initDomainModel } from "foccacia-domain-model";
import errors, { ERROR_CODES } from "../../foccacia-errors/src/errors.mjs";
import { initUtils } from "foccacia-utils";

describe("Web API — unit", () => {
  const domainModel = initDomainModel();
  const utils = initUtils();

  const VALID_TOKEN = "abc123";
  const VALID_USER_ID = "u1";

  const mockServices = {
    createUser: async ({ username }) =>
      new domainModel.User({ id: "1", username, token: VALID_TOKEN }),

    getUserIdFromToken: async ({ token }) => {
      if (token === VALID_TOKEN) return VALID_USER_ID;
      throw errors.UNAUTHORIZED("Invalid token");
    },

    getCompetitions: async () => [
      new domainModel.Competition("PL", "Premier League"),
    ],

    getTeams: async ({ code, season }) => [
      new domainModel.Team({
        teamId: "1",
        teamName: "Man United",
        country: "England",
        players: [],
      }),
    ],

    getGroups: async ({ userId }) => [
      new domainModel.Group({
        id: "g1",
        userId,
        name: "Grupo 1",
        description: "Desc",
        competition: "PL",
        year: 2024,
        players: [],
      }),
    ],

    getGroup: async ({ userId, groupId }) =>
      new domainModel.Group({
        id: groupId,
        userId,
        name: "Meu Grupo",
        description: "Descricao",
        competition: "PL",
        year: 2024,
        players: [],
      }),

    createGroup: async ({ userId, name, description, competition, year }) =>
      new domainModel.Group({
        id: "g1",
        userId,
        name,
        description,
        competition,
        year,
        players: [],
      }),

    updateGroup: async ({ userId, groupId, changes }) =>
      new domainModel.Group({
        id: groupId,
        userId,
        name: changes.name,
        description: changes.description,
        competition: "PL",
        year: 2024,
        players: [],
      }),

    deleteGroup: async () => true,

    addPlayerToGroup: async ({ playerData }) =>
      new domainModel.Player({
        playerId: playerData.playerId,
        playerName: playerData.playerName,
        teamId: "1",
        teamCode: playerData.teamCode,
        teamName: playerData.teamName,
        position: "Forward",
        nationality: "Portugal",
        age: 29,
      }),

    deletePlayerFromGroup: async () => true,
  };

  describe("router wiring", () => {
    it("initializa o router (initWebApi)", () => {
      const router = initWebApi({ services: mockServices, errors, utils });
      assert.ok(router);
    });
  });

  describe("mock services", () => {
    it("createUser cria User com token", async () => {
      const user = await mockServices.createUser({ username: "Anisio" });
      assert.equal(user.username, "Anisio");
      assert.equal(user.token, VALID_TOKEN);
    });

    it("getUserIdFromToken rejeita token inválido (erro)", async () => {
      await assert.rejects(
        () => mockServices.getUserIdFromToken({ token: "errado" }),
        (err) => {
          assert.equal(err.code, ERROR_CODES.Unauthorized);
          assert.equal(err.message, "Invalid token");
          return true;
        }
      );
    });

    it("getCompetitions devolve lista", async () => {
      const comps = await mockServices.getCompetitions();
      assert.ok(Array.isArray(comps));
      assert.equal(comps[0].code, "PL");
    });

    it("getTeams devolve lista de equipas", async () => {
      const teams = await mockServices.getTeams({ code: "PL", season: 2024 });
      assert.ok(Array.isArray(teams));
      assert.equal(teams[0].teamName, "Man United");
    });

    it("createGroup devolve Group coerente", async () => {
      const group = await mockServices.createGroup({
        userId: VALID_USER_ID,
        name: "SLB",
        description: "Glorias Antigas",
        competition: "PPL",
        year: 2023,
      });

      assert.equal(group.name, "SLB");
      assert.equal(group.competition, "PPL");
    });

    it("getGroups devolve lista de groups", async () => {
      const groups = await mockServices.getGroups({ userId: VALID_USER_ID });
      assert.ok(Array.isArray(groups));
      assert.equal(groups[0].name, "Grupo 1");
    });

    it("getGroup devolve o group pedido", async () => {
      const group = await mockServices.getGroup({
        userId: VALID_USER_ID,
        groupId: "g1",
      });
      assert.equal(group.id, "g1");
      assert.equal(group.name, "Meu Grupo");
    });

    it("updateGroup aplica alterações", async () => {
      const updated = await mockServices.updateGroup({
        userId: VALID_USER_ID,
        groupId: "g1",
        changes: { name: "Nome Novo", description: "Desc Nova" },
      });

      assert.equal(updated.name, "Nome Novo");
      assert.equal(updated.description, "Desc Nova");
    });

    it("deleteGroup devolve true", async () => {
      const deleted = await mockServices.deleteGroup({
        userId: VALID_USER_ID,
        groupId: "g1",
      });
      assert.equal(deleted, true);
    });

    it("addPlayerToGroup cria Player coerente", async () => {
      const player = await mockServices.addPlayerToGroup({
        userId: VALID_USER_ID,
        groupId: "g1",
        playerData: {
          playerId: "10",
          playerName: "Cristiano",
          teamCode: "MUN",
          teamName: "Man United",
        },
      });

      assert.equal(player.playerName, "Cristiano");
      assert.equal(player.teamCode, "MUN");
    });

    it("deletePlayerFromGroup devolve true", async () => {
      const removed = await mockServices.deletePlayerFromGroup({
        userId: VALID_USER_ID,
        groupId: "g1",
        playerId: "10",
      });

      assert.equal(removed, true);
    });
  });
});
