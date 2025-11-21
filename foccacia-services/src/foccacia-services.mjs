// foccacia-services.mjs
import * as dataMem from "foccacia-data-mem/src/foccacia-data-mem.mjs";
import errors from "foccacia-server/src/errors.mjs";
import { randomUUID } from "crypto";
import {
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchTeamWithSquad,
} from "fapi-teams-data/src/fapi-teams-data.mjs";
import {
  Competition,
  Player,
  Team,
} from "foccacia-data-mem/src/domain-model.mjs";

// Competitions

export async function getCompetitions() {
  const rawCompetitions = await fetchCompetitions();

  return rawCompetitions.map((c) => new Competition(c.code, c.name));
}

export async function getTeamsForCompetitionAndSeason(code, season) {
  const teams = await fetchCompetitionTeams(code, season);

  let teamsWithSquad;
  try {
    teamsWithSquad = await Promise.all(
      teams.map((t) => fetchTeamWithSquad(t.id))
    );
  } catch (err) {
    if (err.status === 429) {
      throw errors.RATE_LIMIT(
        "Atingido o limite de pedidos à Football Data API. Tente novamente dentro de alguns segundos."
      );
    }
    throw err;
  }

  return teamsWithSquad.map((teamJson) => {
    const players = (teamJson.squad ?? []).map(
      (p) => new Player(p.id, p.name, p.position)
    );

    return new Team(
      teamJson.id,
      teamJson.name,
      teamJson.area?.name ?? null,
      players
    );
  });
}

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

export async function getCompetitionByCode(code) {
  const competitions = await getCompetitions();
  const comp = competitions.find((c) => c.code == code);
  if (!comp) {
    throw errors.NOT_FOUND(`Competition with code ${code} not found`);
  }
  return comp;
}

// Users

export async function createUser(username) {
  const existing = dataMem.findUserByUsername(username);
  if (existing) {
    throw errors.INVALID_DATA(`Username ${username} already exists`);
  }
  const token = randomUUID();
  const user = dataMem.createUser(username, token);
  return user;
}

// usado pelo middleware para validar token
export async function convertTokenToUserId(token) {
  const user = dataMem.findUserByToken(token);
  if (!user) {
    throw errors.NOT_AUTHORIZED("Invalid token");
  }
  return user.id;
}

// Groups
// TODO : criar regras como max 11 jogadores
export async function getGroupsByUser(userId) {
  return dataMem.getGroupsByUser(userId);
}

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

// TODO: Implementar a logica de todas as funções da aplicação
