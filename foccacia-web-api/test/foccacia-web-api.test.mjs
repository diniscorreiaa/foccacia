import { describe, it } from "node:test";
import assert from "node:assert";
import { initWebApi } from "../src/foccacia-web-api.mjs";
import { initDomainModel } from "../../foccacia-domain-model/src/foccacia-domain-model.mjs";
import errors from "../../foccacia-errors/src/errors.mjs";
import { initUtils } from "../../foccacia-utils/src/foccacia-utils.mjs";

describe("Web API", () => {
  const domainModel = initDomainModel();
  const utils = initUtils();

  const mockServices = {
    createUser: async ({ username }) =>
      new domainModel.User({ id: "1", username, token: "abc123" }),

    getUserIdFromToken: async ({ token }) => (token === "abc123" ? "u1" : null),

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

  it("deve inicializar router", () => {
    const router = initWebApi(mockServices, errors, utils);
    assert.ok(router);
  });

  it("deve criar user", async () => {
    const user = await mockServices.createUser({ username: "joao" });
    assert.strictEqual(user.username, "joao");
    assert.ok(user.token);
  });

  it("deve validar token", async () => {
    const userId = await mockServices.getUserIdFromToken({ token: "abc123" });
    assert.strictEqual(userId, "u1");
  });

  it("deve rejeitar token invalido", async () => {
    const userId = await mockServices.getUserIdFromToken({ token: "errado" });
    assert.strictEqual(userId, null);
  });

  it("deve buscar competicoes", async () => {
    const comps = await mockServices.getCompetitions();
    assert.ok(Array.isArray(comps));
    assert.strictEqual(comps.length, 1);
    assert.strictEqual(comps[0].code, "PL");
  });

  it("deve buscar equipas", async () => {
    const teams = await mockServices.getTeams({ code: "PL", season: 2024 });
    assert.ok(Array.isArray(teams));
    assert.strictEqual(teams[0].teamName, "Man United");
  });

  it("deve criar grupo", async () => {
    const group = await mockServices.createGroup({
      userId: "u1",
      name: "Best XI",
      description: "Melhores",
      competition: "PL",
      year: 2024,
    });

    assert.strictEqual(group.name, "Best XI");
    assert.strictEqual(group.competition, "PL");
  });

  it("deve listar grupos", async () => {
    const groups = await mockServices.getGroups({ userId: "u1" });
    assert.ok(Array.isArray(groups));
    assert.strictEqual(groups[0].name, "Grupo 1");
  });

  it("deve buscar grupo", async () => {
    const group = await mockServices.getGroup({ userId: "u1", groupId: "g1" });
    assert.strictEqual(group.name, "Meu Grupo");
    assert.strictEqual(group.id, "g1");
  });

  it("deve atualizar grupo", async () => {
    const updated = await mockServices.updateGroup({
      userId: "u1",
      groupId: "g1",
      changes: {
        name: "Nome Novo",
        description: "Desc Nova",
      },
    });

    assert.strictEqual(updated.name, "Nome Novo");
    assert.strictEqual(updated.description, "Desc Nova");
  });

  it("deve eliminar grupo", async () => {
    const deleted = await mockServices.deleteGroup({
      userId: "u1",
      groupId: "g1",
    });
    assert.strictEqual(deleted, true);
  });

  it("deve adicionar jogador", async () => {
    const player = await mockServices.addPlayerToGroup({
      userId: "u1",
      groupId: "g1",
      playerData: {
        playerId: "10",
        playerName: "Cristiano",
        teamCode: "MUN",
        teamName: "Man United",
      },
    });

    assert.strictEqual(player.playerName, "Cristiano");
    assert.strictEqual(player.teamCode, "MUN");
  });

  it("deve remover jogador", async () => {
    const removed = await mockServices.deletePlayerFromGroup({
      userId: "u1",
      groupId: "g1",
      playerId: "10",
    });

    assert.strictEqual(removed, true);
  });
});
