import express from "express";
// TODO : dataMem & fapiTeams init
import * as dataMem from "foccacia-data-mem";
import * as fapiTeams from "fapi-teams-data";

import * as utilsLib from "foccacia-utils";
import errorsLib, { ERROR_CODES } from "foccacia-errors";

import { initServices } from "foccacia-services";

import { initWebApi } from "foccacia-web-api";
import { initDto } from "foccacia-web-api/src/foccacia-dto.mjs";
import { initSendApplicationError } from "foccacia-web-api/src/application-to-http-errors.mjs";

export function createFoccaciaApp() {
  const services = initServices({
    dataMem,
    fapiTeams,
    utils: utilsLib,
    errors: errorsLib,
  });

  const dto = initDto();
  const api = initWebApi({
    services,
    dto,
    errors: errorsLib,
    utils: utilsLib,
  });

  const app = express();
  app.use(express.json());

  const sendApplicationError = initSendApplicationError({
    ERROR_CODES,
    logError: utilsLib.logError,
  });

  return {
    app,
    api,
    sendApplicationError,
    errors: errorsLib,
    utils: utilsLib,
  };
}
