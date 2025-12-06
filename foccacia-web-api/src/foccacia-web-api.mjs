const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const [type, value] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";
  return value;
}

export function initWebApi({ services, dto, errors, utils }) {
  async function genericApiRoute(
    req,
    res,
    servicesFunc,
    { transformObj = (obj) => obj, servicesFuncArgs = [] } = {}
  ) {
    const obj = await servicesFunc(...servicesFuncArgs);
    const size = Array.isArray(obj) ? obj.length : 1;

    utils.logInfo(
      `API: responding with ${size} item(s) for path ${req.path}`,
      ""
    );
    res.json(transformObj(obj));
  }

  // TODO : ALL => Em modular ainda mais as funcoes para evitar duplicacao de codigo, os middlewares, etc, podem ser chamados no return para nao contaminar visualmente as funcoes
  const verifyToken = wrapAsync((req, res, next) => {
    const token = getToken(req);
    if (!token) {
      throw errors.UNAUTHORIZED("Missing or invalid Bearer token");
    }

    const userId = services.getUserIdFromToken(token);
    req.token = token;
    req.userId = userId;
    utils.logInfo(
      `Request authorized for user ${userId} ${req.method} ${req.path}`,
      ""
    );

    next();
  });

  // Competitions
  const getCompetitions = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getCompetitions)
  );

  // Teams
  const getTeams = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getTeams, {
      servicesFuncArgs: [req.params.competitionCode, req.params.seasonYear],
      transformObj: (teamsArr) => teamsArr.map(dto.teamToDto),
    })
  );

  // Users
  const createUser = wrapAsync((req, res) => {
    const username = req.body?.username;
    const user = services.createUser(username);
    return res.status(201).json(dto.userToDto(user));
  });

  // Groups
  const getGroups = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getGroups, {
      servicesFuncArgs: [req.userId],
      transformObj: (groups) => groups.map(dto.groupToDto),
    })
  );

  const createGroup = wrapAsync((req, res) => {
    const { name, description, competition, year } = req.body ?? {};
    const group = services.createGroup(
      req.userId,
      name,
      description,
      competition,
      year
    );
    return res.status(201).json(dto.groupToDto(group));
  });

  const getGroup = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId],
      transformObj: dto.groupToDto,
    })
  );

  const updateGroup = wrapAsync((req, res) => {
    const { name, description } = req.body ?? {};
    return genericApiRoute(req, res, services.updateGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId, { name, description }],
      transformObj: dto.groupToDto,
    });
  });

  // TODO : Tiago => Verificar se o deleteGroup deve ser async
  const deleteGroup = wrapAsync((req, res) => {
    const result = services.deleteGroup(req.userId, req.params.groupId);
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error")
    }
    return res.sendStatus(204);
  });

  const addPlayerToGroup = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.addPlayerToGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId, req.body],
      transformObj: dto.playerToGroupDto,
    })
  );

  // TODO : Tiago => Verificar se o deletePlayerFromGroup deve ser async
  const deletePlayerFromGroup = wrapAsync((req, res) => {
    const result = services.deletePlayerFromGroup(
      req.userId,
      req.params.groupId,
      req.params.playerId
    );
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error")
    }
    return res.sendStatus(204);
  });

  return {
    verifyToken,
    getCompetitions,
    getTeams,
    createUser,
    getGroups,
    createGroup,
    getGroup,
    updateGroup,
    deleteGroup,
    addPlayerToGroup,
    deletePlayerFromGroup,
  };
}

// TODO : ALL => Exemplo de modularizacao das funncoes em vez cada uma ter o wrapAsync, fazer o wrap aqui no return
