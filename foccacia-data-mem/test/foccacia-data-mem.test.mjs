import { describe, it } from "node:test";
import assert from "node:assert";
import { initDataMem } from "../src/foccacia-data-mem.mjs";
import { initDomainModel } from "../../foccacia-domain-model/src/foccacia-domain-model.mjs";
import { initUtils } from "../../foccacia-utils/src/foccacia-utils.mjs";

describe("Data Mem", () => {
  const domainModel = initDomainModel();
  const utils = initUtils();

  describe("Users", () => {
    it("deve criar utilizador", async () => {
      const data = initDataMem({ domainModel, utils });
      const user = await data.createUser({ username: "joao" });

      assert.ok(user);
      assert.strictEqual(user.username, "joao");
      assert.ok(user.token);
      assert.ok(user.id);
    });

    it("deve retornar null se username vazio", async () => {
      const data = initDataMem({ domainModel, utils });
      const user = await data.createUser({ username: "" });

      assert.strictEqual(user, null);
    });

    it("deve encontrar user por token", async () => {
      const data = initDataMem({ domainModel, utils });
      const created = await data.createUser({ username: "maria" });
      const found = await data.getUserByToken({ token: created.token });

      assert.ok(found);
      assert.strictEqual(found.username, "maria");
    });

    it("deve retornar null para token inexistente", async () => {
      const data = initDataMem({ domainModel, utils });
      const found = await data.getUserByToken({ token: "token-falso" });

      assert.strictEqual(found, null);
    });
  });

  describe("Groups", () => {
    it("deve criar grupo", async () => {
      const data = initDataMem({ domainModel, utils });
      const group = await data.createGroup({
        userId: "u1",
        name: "Best XI",
        description: "Melhores jogadores",
        competition: "PL",
        year: 2024,
      });

      assert.ok(group);
      assert.strictEqual(group.name, "Best XI");
      assert.strictEqual(group.description, "Melhores jogadores");
      assert.strictEqual(group.competition, "PL");
      assert.strictEqual(group.year, 2024);
      assert.deepStrictEqual(group.players, []);
    });

    it("deve retornar null se faltar parametros", async () => {
      const data = initDataMem({ domainModel, utils });
      const group = await data.createGroup({
        userId: "u1",
        name: "Grupo",
      });

      assert.strictEqual(group, null);
    });

    it("deve listar grupos do user", async () => {
      const data = initDataMem({ domainModel, utils });
      await data.createGroup({
        userId: "u1",
        name: "Grupo 1",
        description: "D1",
        competition: "PL",
        year: 2024,
      });
      await data.createGroup({
        userId: "u1",
        name: "Grupo 2",
        description: "D2",
        competition: "PL",
        year: 2024,
      });

      const groups = await data.listGroups({ userId: "u1" });
      assert.strictEqual(groups.length, 2);
    });

    it("deve buscar grupo por id", async () => {
      const data = initDataMem({ domainModel, utils });
      const created = await data.createGroup({
        userId: "u1",
        name: "Grupo",
        description: "D",
        competition: "PL",
        year: 2024,
      });

      const found = await data.getGroup({ groupId: created.id });
      assert.ok(found);
      assert.strictEqual(found.name, "Grupo");
    });

    it("deve atualizar grupo", async () => {
      const data = initDataMem({ domainModel, utils });
      const created = await data.createGroup({
        userId: "u1",
        name: "Nome Antigo",
        description: "Desc Antiga",
        competition: "PL",
        year: 2024,
      });

      const updated = await data.updateGroup({
        groupId: created.id,
        name: "Nome Novo",
        description: "Desc Nova",
      });

      assert.ok(updated);
      assert.strictEqual(updated.name, "Nome Novo");
      assert.strictEqual(updated.description, "Desc Nova");
    });

    it("deve eliminar grupo", async () => {
      const data = initDataMem({ domainModel, utils });
      const created = await data.createGroup({
        userId: "u1",
        name: "Grupo",
        description: "D",
        competition: "PL",
        year: 2024,
      });

      const deleted = await data.deleteGroup({ groupId: created.id });
      assert.strictEqual(deleted, true);

      const found = await data.getGroup({ groupId: created.id });
      assert.strictEqual(found, null);
    });
  });

  describe("Players in Groups", () => {
    it("deve adicionar jogador ao grupo", async () => {
      const data = initDataMem({ domainModel, utils });
      const group = await data.createGroup({
        userId: "u1",
        name: "G",
        description: "D",
        competition: "PL",
        year: 2024,
      });

      const player = await data.addPlayerToGroup({
        groupId: group.id,
        player: {
          id: "1",
          playerName: "Cristiano Ronaldo",
          teamId: "100",
          teamName: "Man United",
          position: "Forward",
        },
      });

      assert.ok(player);
      assert.strictEqual(player.playerName, "Cristiano Ronaldo");
    });

    it("deve remover jogador do grupo", async () => {
      const data = initDataMem({ domainModel, utils });
      const group = await data.createGroup({
        userId: "u1",
        name: "G",
        description: "D",
        competition: "PL",
        year: 2024,
      });

      await data.addPlayerToGroup({
        groupId: group.id,
        player: { id: "1", playerName: "Jogador" },
      });

      const deleted = await data.deletePlayerFromGroup({
        groupId: group.id,
        playerId: "1",
      });

      assert.strictEqual(deleted, true);
    });

    it("deve retornar false ao remover jogador inexistente", async () => {
      const data = initDataMem({ domainModel, utils });
      const group = await data.createGroup({
        userId: "u1",
        name: "G",
        description: "D",
        competition: "PL",
        year: 2024,
      });

      const deleted = await data.deletePlayerFromGroup({
        groupId: group.id,
        playerId: "999",
      });

      assert.strictEqual(deleted, false);
    });
  });
});
