import { Competition, findUserByToken, Player, Team } from "foccacia-data-mem";
import {
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchTeamWithSquad,
} from "fapi-teams-data";
import { logInfo } from "foccacia-utils";
import errors from "foccacia-errors";
// import {
//   createUser as createUserMem,
//   // ... listGroups, createGroup, etc...
// } from "foccacia-data-mem";

// Competitions
export async function getCompetitions() {
  try {
    const raw = await fetchCompetitions();
    const competitions = raw.map(
      (competition) => new Competition(competition.code, competition.name)
    );
    logInfo(`Service: loaded ${competitions.length} competitions`, "");
    return competitions;
  } catch (err) {
    logError("Unexpected error fetching for all competitions", err);
    throw err;
  }
}

// Teams
export async function getTeams(code, season) {
  try {
    const teams = await fetchCompetitionTeams(code, season);
    logInfo(
      `Service: fetched ${teams.length} teams for competition ${code} season ${season}`,
      ""
    );

    // TODO : squads to teams
    const squads = await Promise.all(
      teams.map((team) => fetchTeamWithSquad(team.id))
    );

    // TODO : players acrescentar o resto das propriedades do player e o seu dto
    const result = squads.map((teamJson) => {
      const players = (teamJson.squad ?? []).map(
        (player) => new Player(player.id, player.name, player.position)
      );

      return new Team(
        teamJson.id,
        teamJson.name,
        teamJson.area?.name ?? null,
        players
      );
    });

    logInfo(
      `Service: built ${result.length} Team objects for competition ${code} season ${season}`
    );
    return result;
  } catch (err) {
    logError(
      `Unexpected error fetching for teams of competition ${code} season ${season}`,
      err
    );
    throw err;
  }
}

export async function convertTokenToUserId(token) {
  const user = findUserByToken(token);
  if (!user) {
    throw errors.UNAUTHORIZED("Invalid token");
  }
  return user.id;
}

export function createUser() {}
export function getGroups() {}
export function createGroup() {}
export function getGroup() {}
export function replaceGroup() {}
export function deleteGroup() {}
export function addPlayerToGroup() {}
export function deletePlayerFromGroup() {}

// TODO : diferente estrutura em baixo

// export async function getCompetitions() {
//   // 1) tentar usar cache
//   const cached = dataMem.getCompetitionCache();
//   if (cached.length > 0) return cached;
//   // 2) fetch Football Data API
//   const competitions = await teamsApi.fetchCompetitions();
//   // aqui transforma resultado raw da FAPI em objetos Competition, save em cache
//   dataMem.setCompetitionCache(competitions);
//   return competitions;
// }

// Users

// export async function createUser(username) {
//   const existing = dataMem.findUserByUsername(username);
//   if (existing) {
//     throw errors.INVALID_DATA(`Username ${username} already exists`);
//   }
//   const token = randomUUID();
//   const user = dataMem.createUser(username, token);
//   return user;
// }
//
// // usado pelo middleware para validar token
// export async function convertTokenToUserId(token) {
//   const user = dataMem.findUserByToken(token);
//   if (!user) {
//     throw errors.NOT_AUTHORIZED("Invalid token");
//   }
//   return user.id;
// }

// Groups
// TODO : criar regras como max 11 jogadores
// export async function getGroupsByUser(userId) {
//   return dataMem.getGroupsByUser(userId);
// }

// TODO : Adaptar as funcionalidades do nosso projecto

// export default function (data, users) {
//   return {
//     getBooks: getBooks,
//     getBook: getBook,
//   };
//
//   async function getBooks(token) {
//     return data.getBooks();
//   }
//
//   export async function getBook(bookId, token) {
//     return data
//       .getBook(bookId)
//       .then((book) =>
//         users.convertTokenToId(token).then((id) => validateOwner(book, id))
//       );
//
//     function validateOwner(book, userId) {
//       if (book.ownerId == userId) {
//         return book;
//       }
//       return Promise.reject(
//         errors.NOT_AUTHORIZED(
//           `The user does not have access to the book with id ${bookId}`
//         )
//       );
//     }
//   }
// }
