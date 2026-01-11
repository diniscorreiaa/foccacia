const api = "http://localhost:1904/api",
  usernameToCreate = "usertest";

const benficaPlayers = [
  {
    playerId: 67299,
    playerName: "Vangelis Pavlidis",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 111481,
    playerName: "Anatolii Trubin",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 81816,
    playerName: "Amar Dedić",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 185610,
    playerName: "Antonio Silva",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 3205,
    playerName: "Nicolás Otamendi",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 175753,
    playerName: "Samuel Dahl",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 38088,
    playerName: "Fredrik Aursnes",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 82403,
    playerName: "Leandro Barreiro Martins",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 151558,
    playerName: "Heorhii Sudakov",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 9553,
    playerName: "Bruma",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
  {
    playerId: 8128,
    playerName: "Dodi Lukebakio",
    teamCode: "BEN",
    teamName: "SL Benfica",
  },
];

async function postAuth(path, authtoken, body) {
  return (
    await fetch(path, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + authtoken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
  ).json();
}

const { username, token } = await postAuth(`${api}/users`, undefined, {
  username: usernameToCreate,
});

console.log(`Created user ${username}`);
console.log(`Token for said user is ${token}`);

const { id } = await postAuth(`${api}/groups`, token, {
  name: "Melhores da Primeira Liga",
  description: "Onze ideal da Primeira Liga {{season}}",
  competition: "PPL",
  year: 2025,
});
console.log(`Created group ${id}`);

for (const player of benficaPlayers) {
  await postAuth(`${api}/groups/${id}/players`, token, player);
  console.log(`Added player ${player.playerName} to group ${id}`);
}
