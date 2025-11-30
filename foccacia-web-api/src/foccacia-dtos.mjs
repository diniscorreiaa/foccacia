// TODO : Sem Depedencias externas

export function initDtos() {
  function teamToDto(team) {
    return {
      teamName: team.teamName,
      country: team.country,
      players: team.players.map(playerToTeamDto),
    };
  }

  function groupToDto(group) {
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

  function playerToGroupDto(player) {
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

  function userToDto(user) {
    return {
      username: user.username,
      token: user.token,
    };
  }
  return {
    teamToDto,
    groupToDto,
    playerToGroupDto,
    userToDto,
  };
}
