import assert from "node:assert/strict";

import { initServices } from "../src/foccacia-services.mjs";
import { initDomainModel } from "foccacia-domain-model";
import { initUtils } from "foccacia-utils";
import errors from "../../foccacia-errors/src/errors.mjs";

describe("Services", () => {
  const domainModel = initDomainModel();
  const utils = initUtils();

  describe("Create User", () => {
    it("deve criar user com username valido", async () => {
      const mockData = {
        createUser: async ({ username }) =>
          new domainModel.User({ id: "1", username }),
        getUserByUsername: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const user = await services.createUser({ username: "joao" });
      assert.strictEqual(user.username, "joao");
      assert.ok(user.token);
    });

    it("deve rejeitar username com menos de 3 caracteres", async () => {
      const mockData = {
        getUserByUsername: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.createUser({ username: "ab" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 1);
        assert.ok(err.message.includes("3 characters"));
      }
    });

    it("deve rejeitar username ja existente", async () => {
      const mockData = {
        getUserByUsername: async ({ username }) =>
          username === "joao"
            ? new domainModel.User({ id: "1", username })
            : null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.createUser({ username: "joao" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 6);
        assert.ok(err.message.includes("already exists"));
      }
    });

    it("deve aceitar username valido com espacos", async () => {
      const mockData = {
        createUser: async ({ username }) =>
          new domainModel.User({ id: "1", username }),
        getUserByUsername: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const user = await services.createUser({ username: "  maria  " });
      assert.strictEqual(user.username, "maria");
    });
  });

  describe("Create Group", () => {
    it("deve criar grupo com dados validos", async () => {
      const mockData = {
        createGroup: async (params) =>
          new domainModel.Group({ id: "g1", ...params }),
        getGroup: async ({ groupId }) =>
          groupId === "g1"
            ? new domainModel.Group({
                id: "g1",
                userId: "u1",
                name: "Grupo",
                description: "Desc",
                competition: "PL",
                year: 2024,
              })
            : null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const group = await services.createGroup({
        userId: "u1",
        name: "Best XI",
        description: "Melhores",
        competition: "PL",
        year: 2024,
      });

      assert.strictEqual(group.name, "Best XI");
      assert.strictEqual(group.competition, "PL");
      assert.strictEqual(group.year, 2024);
    });

    it("deve rejeitar se userId for invalido", async () => {
      const mockData = {
        createGroup: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.createGroup({
          userId: "",
          name: "Grupo",
          description: "D",
          competition: "PL",
          year: 2024,
        });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 2);
      }
    });

    it("deve validar ano com 4 digitos", async () => {
      const mockData = {
        createGroup: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.createGroup({
          userId: "u1",
          name: "Grupo",
          description: "D",
          competition: "PL",
          year: 99,
        });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 1);
      }
    });
  });

  describe("Get Groups", () => {
    it("deve listar grupos do user", async () => {
      const mockData = {
        listGroups: async ({ userId }) => [
          new domainModel.Group({
            id: "g1",
            userId,
            name: "Grupo 1",
            description: "D1",
            competition: "PL",
            year: 2024,
          }),
          new domainModel.Group({
            id: "g2",
            userId,
            name: "Grupo 2",
            description: "D2",
            competition: "PD",
            year: 2024,
          }),
        ],
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const groups = await services.getGroups({ userId: "u1" });
      assert.strictEqual(groups.length, 2);
      assert.strictEqual(groups[0].name, "Grupo 1");
      assert.strictEqual(groups[1].name, "Grupo 2");
    });

    it("deve exigir userId valido", async () => {
      const mockData = {
        listGroups: async () => [],
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getGroups({ userId: "" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 2);
      }
    });
  });

  describe("Get Group", () => {
    it("deve buscar grupo especifico", async () => {
      const mockData = {
        getGroup: async ({ groupId }) =>
          groupId === "g1"
            ? new domainModel.Group({
                id: "g1",
                userId: "u1",
                name: "Meu Grupo",
                description: "Descricao",
                competition: "PL",
                year: 2024,
                players: [],
              })
            : null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const group = await services.getGroup({ userId: "u1", groupId: "g1" });
      assert.strictEqual(group.name, "Meu Grupo");
    });

    it("deve rejeitar se grupo nao existir", async () => {
      const mockData = {
        getGroup: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getGroup({ userId: "u1", groupId: "g999" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 3);
      }
    });

    it("deve rejeitar se user nao for dono", async () => {
      const mockData = {
        getGroup: async () =>
          new domainModel.Group({
            id: "g1",
            userId: "u1",
            name: "Grupo",
            description: "D",
            competition: "PL",
            year: 2024,
          }),
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getGroup({ userId: "u2", groupId: "g1" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 4);
      }
    });
  });

  describe("Update Group", () => {
    it("deve atualizar nome e descricao", async () => {
      const mockData = {
        getGroup: async ({ groupId }) =>
          new domainModel.Group({
            id: groupId,
            userId: "u1",
            name: "Nome Antigo",
            description: "Desc Antiga",
            competition: "PL",
            year: 2024,
          }),
        updateGroup: async ({ groupId, name, description }) => {
          const g = await mockData.getGroup({ groupId });
          g.name = name;
          g.description = description;
          return g;
        },
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const updated = await services.updateGroup({
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

    it("deve rejeitar se user nao for dono", async () => {
      const mockData = {
        getGroup: async () =>
          new domainModel.Group({
            id: "g1",
            userId: "u1",
            name: "G",
            description: "D",
            competition: "PL",
            year: 2024,
          }),
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.updateGroup({
          userId: "u2",
          groupId: "g1",
          changes: { name: "Novo", description: "Nova" },
        });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 4);
      }
    });
  });

  describe("Delete Group", () => {
    it("deve eliminar grupo", async () => {
      const mockData = {
        getGroup: async () =>
          new domainModel.Group({
            id: "g1",
            userId: "u1",
            name: "G",
            description: "D",
            competition: "PL",
            year: 2024,
          }),
        deleteGroup: async () => true,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const deleted = await services.deleteGroup({
        userId: "u1",
        groupId: "g1",
      });

      assert.strictEqual(deleted, true);
    });

    it("deve rejeitar se user nao for dono", async () => {
      const mockData = {
        getGroup: async () =>
          new domainModel.Group({
            id: "g1",
            userId: "u1",
            name: "G",
            description: "D",
            competition: "PL",
            year: 2024,
          }),
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.deleteGroup({ userId: "u2", groupId: "g1" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 4);
      }
    });
  });

  describe("Add Player to Group", () => {
    it("deve adicionar jogador", async () => {
      const mockData = {
        getGroup: async () =>
          new domainModel.Group({
            id: "g1",
            userId: "u1",
            name: "G",
            description: "D",
            competition: "PL",
            year: 2024,
            players: [],
          }),
        addPlayerToGroup: async ({ player }) =>
          new domainModel.Player({
            playerId: player.playerId,
            playerName: player.playerName,
            teamId: player.teamId,
            teamCode: player.teamCode,
            teamName: player.teamName,
            position: player.position,
            nationality: player.nationality,
            age: player.age,
          }),
      };

      const mockFapi = {
        getPlayerForCompetition: async () =>
          new domainModel.Player({
            playerId: "10",
            playerName: "Bruno",
            teamId: "100",
            teamCode: "MUN",
            teamName: "Man United",
            position: "Midfielder",
            nationality: "Portugal",
            age: 29,
          }),
      };

      const services = initServices({
        data: mockData,
        fapiTeams: mockFapi,
        utils,
        errors,
      });

      const player = await services.addPlayerToGroup({
        userId: "u1",
        groupId: "g1",
        playerData: {
          playerId: "10",
          playerName: "Bruno",
          teamCode: "MUN",
          teamName: "Man United",
        },
      });

      assert.strictEqual(player.playerName, "Bruno");
    });
  });

  describe("Get Competitions", () => {
    it("deve retornar competicoes", async () => {
      const mockFapi = {
        getCompetitions: async () => [
          new domainModel.Competition("PL", "Premier League"),
          new domainModel.Competition("PD", "La Liga"),
        ],
      };

      const services = initServices({
        data: {},
        fapiTeams: mockFapi,
        utils,
        errors,
      });

      const comps = await services.getCompetitions();
      assert.strictEqual(comps.length, 2);
      assert.strictEqual(comps[0].code, "PL");
      assert.strictEqual(comps[0].name, "Premier League");
    });

    it("deve dar erro em rate limit", async () => {
      const mockFapi = {
        getCompetitions: async () => false,
      };

      const services = initServices({
        data: {},
        fapiTeams: mockFapi,
        utils,
        errors,
      });

      try {
        await services.getCompetitions();
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 5);
      }
    });
  });

  describe("Get Teams", () => {
    it("deve retornar equipas com jogadores", async () => {
      const mockFapi = {
        getTeamsWithSquads: async () => [
          new domainModel.Team({
            teamId: "1",
            teamName: "Manchester United",
            country: "England",
            players: [
              new domainModel.Player({
                playerId: "10",
                playerName: "Bruno Fernandes",
                teamId: "1",
                teamCode: "MUN",
                teamName: "Man United",
                position: "Midfielder",
                nationality: "Portugal",
                age: 29,
              }),
            ],
          }),
        ],
      };

      const services = initServices({
        data: {},
        fapiTeams: mockFapi,
        utils,
        errors,
      });

      const teams = await services.getTeams({ code: "PL", season: 2024 });
      assert.strictEqual(teams.length, 1);
      assert.strictEqual(teams[0].teamName, "Manchester United");
      assert.strictEqual(teams[0].players[0].playerName, "Bruno Fernandes");
    });

    it("deve validar codigo da competicao", async () => {
      const services = initServices({
        data: {},
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getTeams({ code: "", season: 2024 });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 1);
      }
    });

    it("deve validar ano da epoca", async () => {
      const services = initServices({
        data: {},
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getTeams({ code: "PL", season: 99 });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 1);
      }
    });
  });

  describe("Token Validation", () => {
    it("deve validar token correto", async () => {
      const mockData = {
        getUserByToken: async ({ token }) =>
          token === "abc123"
            ? new domainModel.User({
                id: "u1",
                username: "joao",
                token: "abc123",
              })
            : null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      const userId = await services.getUserIdFromToken({ token: "abc123" });
      assert.strictEqual(userId, "u1");
    });

    it("deve rejeitar token invalido", async () => {
      const mockData = {
        getUserByToken: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getUserIdFromToken({ token: "token-errado" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 2);
      }
    });

    it("deve rejeitar token vazio", async () => {
      const mockData = {
        getUserByToken: async () => null,
      };

      const services = initServices({
        data: mockData,
        fapiTeams: {},
        utils,
        errors,
      });

      try {
        await services.getUserIdFromToken({ token: "" });
        assert.fail("Devia dar erro");
      } catch (err) {
        assert.strictEqual(err.code, 2);
      }
    });
  });

  it("getUserIdFromToken: token inválido -> UNAUTHORIZED", async () => {
    const data = { getUserByToken: async () => null };
    const services = initServices({ data, fapiTeams: {}, utils, errors });

    await assert.rejects(
      () => services.getUserIdFromToken({ token: "bad" }),
      (error) => error.code === 2 && error.message.includes("Invalid token")
    );
  });

  it("registerUser: username repetido -> UNPROCESSABLE", async () => {
    const data = {
      getUserByUsername: async () =>
        new domainModel.User({ id: "u1", username: "joao", password: "x" }),
      createUser: async () => null,
    };
    const services = initServices({ data, fapiTeams: {}, utils, errors });

    await assert.rejects(
      () => services.registerUser({ username: "joao", password: "123" }),
      (error) => error.code === 6
    );
  });

  it("validateCredentials: password errada -> UNAUTHORIZED", async () => {
    const data = {
      getUserByUsername: async () =>
        new domainModel.User({ id: "u1", username: "joao", password: "aaa" }),
    };
    const services = initServices({ data, fapiTeams: {}, utils, errors });

    await assert.rejects(
      () => services.validateCredentials({ username: "joao", password: "bbb" }),
      (error) => error.code === 2
    );
  });

  it("addPlayerToGroup: não permite > 11 jogadores", async () => {
    const eleven = Array.from(
      { length: 11 },
      (_, i) => new domainModel.Player({ playerId: String(i), playerName: "P" })
    );
    const data = {
      getGroup: async () =>
        new domainModel.Group({
          id: "g1",
          userId: "u1",
          name: "G",
          description: "D",
          competition: "PL",
          year: 2024,
          players: eleven,
        }),
      addPlayerToGroup: async () => null,
    };
    const fapiTeams = {
      getPlayerForCompetition: async () =>
        new domainModel.Player({ playerId: "99", playerName: "X" }),
    };
    const services = initServices({ data, fapiTeams, utils, errors });

    await assert.rejects(
      () =>
        services.addPlayerToGroup({
          userId: "u1",
          groupId: "g1",
          playerData: {
            playerId: "99",
            playerName: "X",
            teamCode: "T",
            teamName: "TN",
          },
        }),
      (error) => error.code === 6 && error.message.includes("11")
    );
  });
});
