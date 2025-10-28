import { logSuccess } from "../../log-utils.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

logSuccess(hello());

// TODO: implement foccacia-server
