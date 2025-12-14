import express from "express";
import { engine } from "express-handlebars";
import { createFoccaciaApp } from "./foccacia-module-resolver.mjs";

const { apiRouter, siteRouter, errors, sendApplicationError, utils } =
  createFoccaciaApp();

const viewsPath = utils.getViewsDirPath();

const PORT = 1904;

const app = express();
app.use(express.json());

// Registering handlebars view engine
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", viewsPath);

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
  utils.logSuccess(`Website available at http://localhost:${PORT}/`, "");
});
