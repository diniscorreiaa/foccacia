import errorsLib, { ERROR_CODES } from "foccacia-errors";

import { initLogUtils } from "foccacia-utils/src/log-utils.mjs";
import { initIoUtils } from "foccacia-utils/src/io-utils.mjs";
import { initJsonUtils } from "foccacia-utils/src/json-utils.mjs";
import { initUtils } from "foccacia-utils/src/foccacia-utils.mjs";

import { initFapiTeams } from "fapi-teams-data";
import { initDomainModel } from "foccacia-domain-model";
import { initDataMem } from "foccacia-data-mem";
import { initDataElasticSearch } from "foccacia-db";
import { initServices } from "foccacia-services";

import { initWebApi } from "foccacia-web-api";
import { initWebSite } from "foccacia-web-site";
import { initDto } from "foccacia-web-api/src/foccacia-dto.mjs";
import { initSendApplicationError } from "foccacia-web-api/src/application-to-http-errors.mjs";

// TODO : PROFESSOR SIM! => Persistência ? Carregar users e groups at startup ?

export function createFoccaciaApp() {
  const logUtils = initLogUtils();
  const ioUtils = initIoUtils();
  const jsonUtils = initJsonUtils({
    ioUtils,
    errors: errorsLib,
  });
  const utils = initUtils({ logUtils, ioUtils, jsonUtils });

  const domainModel = initDomainModel();
  const dataMem = initDataMem({ domainModel, utils, errors: errorsLib });
  const dataElasticSearch = initDataElasticSearch({ domainModel, utils });
  const fapiTeams = initFapiTeams({ domainModel, utils });

  const services = initServices({
    data: dataElasticSearch,
    fapiTeams,
    utils,
    errors: errorsLib,
  });

  const dto = initDto();
  const apiRouter = initWebApi({
    services,
    dto,
    errors: errorsLib,
    utils,
  });

  const siteRouter = initWebSite({
    services,
    dto,
    errors: errorsLib,
    utils,
  });

  const sendApplicationError = initSendApplicationError({
    ERROR_CODES,
    logError: utils.logError,
  });

  return {
    apiRouter,
    siteRouter,
    sendApplicationError,
    errors: errorsLib,
    utils,
  };
}
