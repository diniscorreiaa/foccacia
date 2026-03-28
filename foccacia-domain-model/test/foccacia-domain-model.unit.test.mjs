import assert from "node:assert/strict";
import { initDomainModel } from "../src/foccacia-domain-model.mjs";

describe("Domain Model — unit", () => {
  const dm = initDomainModel();

  it("User: gera token por defeito e guarda username", () => {
    const u1 = new dm.User({ id: "1", username: "joao" });
    const u2 = new dm.User({ id: "2", username: "maria" });
    assert.equal(u1.username, "joao");
    assert.ok(u1.token);
    assert.ok(u2.token);
    assert.notEqual(u1.token, u2.token);
  });

  it("Group: mapeia userId -> ownerId e players default []", () => {
    const g = new dm.Group({
      id: "g1",
      userId: "u1",
      name: "Best XI",
      description: "desc",
      competition: "PL",
      year: 2024,
    });
    assert.equal(g.ownerId, "u1");
    assert.deepEqual(g.players, []);
  });

  it("Player/Team/Competition: mapeiam campos principais", () => {
    const p = new dm.Player({ playerId: "10", playerName: "A", teamId: "1" });
    assert.equal(p.id, "10");
    assert.equal(p.playerName, "A");

    const t = new dm.Team({
      teamId: "1",
      teamName: "X",
      country: "PT",
      players: [],
    });
    assert.equal(t.id, "1");
    assert.equal(t.teamName, "X");

    const c = new dm.Competition("PL", "Premier League");
    assert.equal(c.code, "PL");
    assert.equal(c.name, "Premier League");
  });
});
