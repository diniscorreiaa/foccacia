import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

import { initWebApi } from "../src/foccacia-web-api.mjs";
import { initDomainModel } from "foccacia-domain-model";
import errors, { ERROR_CODES } from "../../foccacia-errors/src/errors.mjs";
import { initUtils } from "foccacia-utils";
import { initSendApplicationError } from "foccacia-server/src/application-to-http-errors.mjs";

function buildApp({ services, utils }) {
  const app = express();
  app.use(express.json());

  app.use("/api", initWebApi({ services, errors, utils }));

  app.use(
    initSendApplicationError({
      ERROR_CODES,
      logError: () => {},
    })
  );

  return app;
}

describe("Web API — integration (supertest)", () => {
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

    getTeams: async () => [
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

  const app = buildApp({ services: mockServices, utils });

  it("POST /api/users -> 201 + token", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ username: "joao" })
      .expect(201);

    assert.equal(res.body.username, "joao");
    assert.equal(res.body.token, VALID_TOKEN);
  });

  it("GET /api/groups sem auth -> 401", async () => {
    await request(app).get("/api/groups").expect(401);
  });

  it("GET /api/groups com Bearer -> 200", async () => {
    const res = await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.equal(res.body[0].id, "g1");
  });

  it("GET /api/competitions -> 200", async () => {
    const res = await request(app).get("/api/competitions").expect(200);

    assert.ok(Array.isArray(res.body));
    assert.equal(res.body[0].code, "PL");
  });

  it("GET /api/competitions/:code/teams?season=YYYY -> 200", async () => {
    const res = await request(app)
      .get("/api/competitions/PL/seasons/2024/teams")
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.equal(res.body[0].teamName, "Man United");
  });

  it("POST /api/groups -> 201", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .send({
        name: "Best XI",
        description: "Melhores",
        competition: "PL",
        year: 2024,
      })
      .expect(201);

    assert.equal(res.body.name, "Best XI");
    assert.equal(res.body.competition, "PL");
  });

  it("PUT /api/groups/:id -> 200", async () => {
    const res = await request(app)
      .put("/api/groups/g1")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .send({ name: "Nome Novo", description: "Desc Nova" })
      .expect(200);

    assert.equal(res.body.name, "Nome Novo");
    assert.equal(res.body.description, "Desc Nova");
  });

  it("DELETE /api/groups/:id -> 204", async () => {
    await request(app)
      .delete("/api/groups/g1")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .expect(204);
  });

  it("POST /api/groups/:id/players -> 201/200", async () => {
    const res = await request(app)
      .post("/api/groups/g1/players")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .send({
        playerId: "10",
        playerName: "Cristiano",
        teamCode: "MUN",
        teamName: "Man United",
      })
      .expect(200);

    assert.equal(res.body.playerName, "Cristiano");
  });

  it("DELETE /api/groups/:id/players/:playerId -> 204", async () => {
    await request(app)
      .delete("/api/groups/g1/players/10")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .expect(204);
  });
});
