export function teamToDto(team) {
  return {
    teamName: team.teamName,
    country: team.country,
    players: team.players.map(playerToTeamDto),
  };
}

export function groupToDto(group) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    competition: group.competition,
    year: group.year,
    players: (group.players ?? []).map(playerToGroupDto),
  };
}

function playerToTeamDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}

export function playerToGroupDto(player) {
  return {
    playerId: player.id,
    playerName: player.playerName,
    teamId: player.teamId,
    teamName: player.teamName,
    position: player.position,
    nationality: player.nationality,
    age: player.age,
  };
}

export function userToDto(user) {
  return {
    username: user.username,
    token: user.token,
  };
}
