import { User } from "./domain-model.mjs";

let nextId = 4;

const USERS = [
  new User(1, "User1", "81ddadbe-ef69-49ec-9ed1-82c0ea6fe145"),
  new User(2, "User2", "81ddadbe-ef69-49ec-9ed1-82c0ea6fe146"),
  new User(3, "User3", "81ddadbe-ef69-49ec-9ed1-82c0ea6fe147"),
];

export function getUsers() {
  return Promise.resolve(USERS);
}
