import express from "express";
import * as dataMem from "foccacia-data-mem";
import * as fapiTeams from "fapi-teams-data";
import * as utilsLib from "foccacia-utils";
import errorsLib from "foccacia-errors";

import { initServices } from "foccacia-services";
import { initWebApi } from "foccacia-web-api";
import { initDtos } from "foccacia-web-api/src/foccacia-dtos.mjs";

const services = initServices({
  dataMem,
  fapiTeams,
  utils: utilsLib,
  errors: errorsLib,
});

const dtos = initDtos();

export const app = express();
app.use(express.json());

export const api = initWebApi({
  services,
  dtos,
  errors: errorsLib,
  utils: utilsLib,
});

export const errors = errorsLib;
export const utils = utilsLib;
