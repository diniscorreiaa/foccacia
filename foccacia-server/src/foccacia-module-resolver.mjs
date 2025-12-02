import express from "express";
import { randomUUID } from "node:crypto";

import * as utilsLib from "foccacia-utils";
import errorsLib, { ERROR_CODES } from "foccacia-errors";

import { initFapiTeams } from "fapi-teams-data";
import { initDomainModel } from "foccacia-data-mem/src/domain-model.mjs";
import { initDataMem } from "foccacia-data-mem";
import { initServices } from "foccacia-services";

import { initWebApi } from "foccacia-web-api";
import { initDto } from "foccacia-web-api/src/foccacia-dto.mjs";
import { initSendApplicationError } from "foccacia-web-api/src/application-to-http-errors.mjs";

export function createFoccaciaApp() {
  const domainModel = initDomainModel({ randomUUID });
  const dataMem = initDataMem({ utils: utilsLib, domainModel });

  const fapiTeams = initFapiTeams({ utils: utilsLib, errors: errorsLib });

  const services = initServices({
    domainModel,
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
