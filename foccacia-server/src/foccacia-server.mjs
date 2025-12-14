import express from "express";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";
import path from "path";
import { createFoccaciaApp } from "./foccacia-module-resolver.mjs";

const { apiRouter, siteRouter, errors, sendApplicationError, utils } =
  createFoccaciaApp();

// To make it so path to views is always consistent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsPath = path.join(__dirname, "../../views");
console.log(viewsPath);

const PORT = 1904;

const app = express();
app.use(express.json());

// Registering handlebars view engine
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", viewsPath);

// TODO : Francisco => Make routes dynamic based on available resources

app.use("/api", apiRouter);
app.use(siteRouter);

// Quando nenhuma rota anterior corresponde ao pedido
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
