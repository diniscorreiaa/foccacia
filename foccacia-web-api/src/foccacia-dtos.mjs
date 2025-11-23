export function teamToDto(team) {
  return {
    teamName: team.teamName,
    country: team.country,
    players: team.players.map(playerToTeamDto),
  };
}

export function groupToDto(group) {
  return {
    name: group.name,
    description: group.description,
    competitionCode: group.competitionCode,
    year: group.year,
    players: group.players,
  };
}

function playerToTeamDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}

// TODO : adicionar todos 4 parametros
export function playerToGroupDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}
