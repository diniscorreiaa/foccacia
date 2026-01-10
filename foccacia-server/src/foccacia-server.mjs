import morgan from "morgan";
import express from "express";

import passport from "passport";
import expressSession from "express-session";
import fileStore from "session-file-store";

import { engine } from "express-handlebars";

import { createFoccaciaApp } from "./foccacia-module-resolver.mjs";

const { apiRouter, siteRouter, errors, sendApplicationError, utils, auth } =
  createFoccaciaApp();

const viewsPath = utils.getViewsDirPath();
const PORT = 1904;

const FileStore = fileStore(expressSession);
const SESSION_SECRET = "foccacia-session-secret";

// TODO : Tiago => extrair para uma função
passport.serializeUser((user, done) => {
  done(null, user?.id ?? null);
});

// TODO : Tiago => extrair para uma função
passport.deserializeUser(async (id, done) => {
  try {
    if (!id) return done(null, false);

    const user = await auth.loadUserForSession(id);
    if (!user) return done(null, false);

    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  expressSession({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new FileStore(),
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Registering handlebars view engine
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", viewsPath);

app.use("/codes", express.static(utils.getCodesImagesDirPath()));

app.use("/api", apiRouter);
app.use(siteRouter);

app.use((req, res, next) => {
  next(errors.NOT_FOUND("Route not found"));
});

// Error Handling Middleware
app.use(sendApplicationError);

utils.logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);

app.listen(PORT, () => {
  utils.logSuccess(`Server listening on port ${PORT}`, "");
  utils.logInfo(`Website available at http://localhost:${PORT}/`, "");
});
