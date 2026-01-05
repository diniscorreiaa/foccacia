import errorsLib, { ERROR_CODES } from "foccacia-errors";

import { initUtils } from "foccacia-utils";

import { initFapiTeams } from "fapi-teams-data";
import { initDomainModel } from "foccacia-domain-model";
import { initDataMem } from "foccacia-data-mem";
import { initDataElasticSearch } from "foccacia-db";
import { initServices } from "foccacia-services";

import { initWebApi } from "foccacia-web-api";
import { initWebSite } from "foccacia-web-site";
import { initSendApplicationError } from "./application-to-http-errors.mjs";

export function createFoccaciaApp() {
  const utils = initUtils();

  const domainModel = initDomainModel();
  const dataMem = initDataMem({ domainModel, utils });
  const dataElasticSearch = initDataElasticSearch({ domainModel, utils });
  const fapiTeams = initFapiTeams({ domainModel, utils });

  const services = initServices({
    data: dataElasticSearch,
    fapiTeams,
    utils,
    errors: errorsLib,
  });

  const apiRouter = initWebApi({
    services,
    errors: errorsLib,
    utils,
  });

  const siteRouter = initWebSite({
    services,
    errors: errorsLib,
  });

  const sendApplicationError = initSendApplicationError({
    ERROR_CODES,
    logError: utils.logError,
  });

  const auth = {
    async loadUserForSession(id) {
      return services.getUserSafeById({ id });
    },
  };

  return {
    apiRouter,
    siteRouter,
    sendApplicationError,
    errors: errorsLib,
    utils,
    auth,
  };
}
