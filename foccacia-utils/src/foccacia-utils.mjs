"use strict";

export * from "./io-utils.mjs";
export * from "./json-utils.mjs";
export * from "./log-utils.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

// TODO: implement foccacia-utils
