import express from "express";
import { randomUUID } from "node:crypto";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import errorsLib, { ERROR_CODES } from "foccacia-errors";

import { initLogUtils } from "foccacia-utils/src/log-utils.mjs";
import { initIoUtils } from "foccacia-utils/src/io-utils.mjs";
import { initJsonUtils } from "foccacia-utils/src/json-utils.mjs";
import { initUtils } from "foccacia-utils/src/foccacia-utils.mjs";

import { initFapiTeams } from "fapi-teams-data";
import { initDomainModel } from "foccacia-data-mem/src/domain-model.mjs";
import { initDataMem } from "foccacia-data-mem";
import { initServices } from "foccacia-services";

import { initWebApi } from "foccacia-web-api";
import { initDto } from "foccacia-web-api/src/foccacia-dto.mjs";
import { initSendApplicationError } from "foccacia-web-api/src/application-to-http-errors.mjs";

export function createFoccaciaApp() {
  const logUtils = initLogUtils();
  const ioUtils = initIoUtils({ fsPromises, path, fileURLToPath });
  const jsonUtils = initJsonUtils({
    fsPromises,
    ioUtils,
    errors: errorsLib,
  });
  const utils = initUtils({ logUtils, ioUtils, jsonUtils });

  const domainModel = initDomainModel({ randomUUID });
  const dataMem = initDataMem({ utils, domainModel });

  const fapiTeams = initFapiTeams({ utils, errors: errorsLib });

  const services = initServices({
    domainModel,
    dataMem,
    fapiTeams,
    utils,
    errors: errorsLib,
  });

  const dto = initDto();
  const api = initWebApi({
    services,
    dto,
    errors: errorsLib,
    utils,
  });

  const app = express();
  app.use(express.json());

  // TODO : app.use(express.urlencoded()); Leitura de forms

  const sendApplicationError = initSendApplicationError({
    ERROR_CODES,
    logError: utils.logError,
  });

  return {
    app,
    api,
    sendApplicationError,
    errors: errorsLib,
    utils,
  };
}
