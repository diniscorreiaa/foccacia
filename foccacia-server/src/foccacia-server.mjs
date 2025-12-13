import express from "express";
import { createFoccaciaApp } from "./foccacia-module-resolver.mjs";
const { apiRouter, siteRouter, errors, sendApplicationError, utils } =
  createFoccaciaApp();

const PORT = 1904;

const app = express();
app.use(express.json());

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

app.listen(PORT, () =>
  utils.logSuccess(`Server listening on port ${PORT}`, "")
);
