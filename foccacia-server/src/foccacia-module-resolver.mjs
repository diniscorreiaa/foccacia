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
import { initDto } from "foccacia-web-api/src/foccacia-dto.mjs";
import { initSendApplicationError } from "foccacia-web-api/src/application-to-http-errors.mjs";

// TODO : ALL => create select/create/init  Data layer based on config
// TODO : PROFESSOR ONLY ES => Data layer  return null or throw ?
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
  const fapiTeams = initFapiTeams({ domainModel, utils, errors: errorsLib });

  const services = initServices({
    data: dataElasticSearch,
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

  // TODO : ALL => app.use(express.urlencoded()); Leitura de forms

  const sendApplicationError = initSendApplicationError({
    ERROR_CODES,
    logError: utils.logError,
  });

  return {
    api,
    sendApplicationError,
    errors: errorsLib,
    utils,
  };
}
