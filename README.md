# IPW - Introdução à Programação Web

## TODO : Atualizar para Assignment 3

## Assignment 3
___

- [Practical Assignment](https://github.com/isel-leic-ipw/2526i-IPW-LEIC31D/wiki/IPW_IP-2526-1-A3)


<p align="center">
  <img src="https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg" alt="Review Assignment Due Date" />
</p>

<h2 align="center">📅 Due date for this assignment: 19/12/2025 — 23h59</h2>

---

## Foccacia

Projeto multi-modulos em Node.js (ESM) - documentação curta para instalação, testes e cobertura.

### Estrutura verificada
Modulos presentes:
- `foccacia-server`
- `foccacia-web-api`
- `foccacia-services`
- `fapi-teams-data`
- `foccacia-data-mem`
- `foccacia-utils`
- `TODO : other modules`

Cada módulo tem `package.json`, `src/` e `test/` com testes ESM (`*.test.mjs`).

### Requisitos
- Node.js >= 18
- npm >= 9
- Ambiente: WSL/Ubuntu recomendado para scripts fornecidos

### Configuração recomendada (root `package.json`)
Adicionar workspaces para gestão centralizada:
```json
{
"workspaces": [
"foccacia-server",
"foccacia-web-api",
"foccacia-services",
"fapi-teams-data",
"foccacia-data-mem",
"foccacia-utils",
"TODO : other-modules"
]
}
```

### Instalação
```sh

npm install
```

## Testes
- Comando para executar todos os testes:
```sh

npm run test:all
``` 

## Coverage
- Comando para gerar coverage de todos:
```sh

npm run coverage:all
 ```

___

## Simple Guide to Using GitHub Version Control
___

### **In the Console**

1. **Clone the repository:**
   ```sh
   git clone <repository_link>
   ```

2. **Fetch the latest changes:**
   ```sh
   git fetch
   ```

3. **Before rebasing, remove and save your changes:**
   ```sh
   git stash
   ```

4. **Rebase on the main branch:**
   ```sh
   git rebase origin/main
   ```

5. **After rebasing, retrieve your saved changes:**
   ```sh
   git stash pop
   ```

6. **Create and switch to a new branch:**
   ```sh
   git checkout -b "branch-name"
   ```

7. **Add changes locally:**
   ```sh
   git add <file_path>
   ```

8. **Commit changes locally:**
   ```sh
   git commit -m "message about the changes"
   ```

9. **Push changes to the remote repository:**
   ```sh
   git push
   ```

### **On the Remote Repository (GitHub)**

1. **Go to GitHub and navigate to your repository.**
2. **Switch to your branch.**
3. **Open a Pull Request (PR) and request a review.**

___

# FOCCACIA – Organização dos módulos e plano de trabalho

## TODO : Atualizar

## 1. Módulos e responsabilidades

### 1.1. `foccacia-utils`
**Responsabilidade:** utilitários genéricos, independentes da lógica de negócio.

- `src/foccacia-utils.mjs`  
  Reexporta as funções públicas do módulo (ponto único de import).
- `src/log-utils.mjs`  
  `logInfo`, `logSuccess`, `logError` (único sítio onde existe `console.log`/`console.error`).
- `src/json-utils.mjs`  
  `readJson(filePath)`, `writeJson(data, filePath)` para leitura/escrita de JSON.
- `src/io-utils.mjs`  
  Gestão de paths para `docs/input` e `docs/output/football-api-cache`.  
  Funções: `fileExists`, `getCompetitionsFilePath`, `getCompetitionTeamsFilePath`, `getTeamPlayersFilePath`, `getHeadersFilePath`, etc.

---

### 1.2. `foccacia-data-mem`
**Responsabilidade:** modelo de domínio e armazenamento em memória (USERS e GROUPS).

- `src/domain-model.mjs`
    - `Competition(code, name)`
    - `Team(teamId, teamName, country, players)`
    - `Player(...)` (modelo a alinhar com o uso nos services).
    - `User(userId, username)` → gera `token` com `randomUUID()` de `node:crypto`.
    - `Group(userId, groupId, name, description, competitionCode, year, players = [])`.
- `src/foccacia-data-mem.mjs`
    - Arrays em memória: `USERS`, `GROUPS`.
    - Funções:
        - Users: `createUser`, `findUserByToken`, `getAllUsers`.
        - Groups: `createGroup`, `getGroupById`/`getGroup`, `listGroups`, `updateGroup`, `deleteGroup`.
        - Players em grupo: `addPlayerToGroup`, `removePlayerFromGroup`.

> Aqui não há noção de HTTP. É “repositório em memória” puro.

---

### 1.3. `fapi-teams-data`
**Responsabilidade:** acesso à **Football Data API** + cache em ficheiros.

- `src/fapi-teams-data.mjs`
    - Lê `headers.json` de `docs/input` para obter `X-Auth-Token`.
    - Usa `fetch` para:
        - `/competitions`
        - `/competitions/{code}/teams?season={year}`
        - `/teams/{teamId}`
    - Cache:
        - `competitions.json`
        - `competition-{code}-{season}-teams.json`
        - `team-{id}-players.json`
    - Em caso de erro HTTP:
        - Mapeia status (ex.: 429) para erros de aplicação (`RATE_LIMIT`, `BAD_GATEWAY`, etc.).
    - Usa:
        - `foccacia-utils` para logs e paths.
        - `foccacia-errors` (no desenho final) para criar erros de aplicação.

---

### 1.4. `foccacia-services`
**Responsabilidade:** **regras de negócio** e orquestração entre dados externos e dados em memória.

- `src/foccacia-services.mjs`
    - Já implementado:
        - `getCompetitions()` → chama `fetchCompetitions`, mapeia para `Competition`.
        - `getTeams(code, season)` → chama `fetchCompetitionTeams` + `fetchTeamWithSquad`, constrói `Team` e `Player` (a ajustar).
    - A implementar/preencher:
        - `createUser(username)`
        - `convertTokenToUserId(token)`
        - `getGroups(userId)`
        - `createGroup(userId, groupData)`
        - `getGroup(userId, groupId)`
        - `replaceGroup(userId, groupId, groupData)`
        - `deleteGroup(userId, groupId)`
        - `addPlayerToGroup(userId, groupId, playerData)`
        - `deletePlayerFromGroup(userId, groupId, playerId)`
    - Este módulo:
        - Trabalha sempre com dados “puros” (sem Express/HTTP).
        - Usa `foccacia-data-mem` como repositório.
        - Usa `fapi-teams-data` para validar informação de equipas/jogadores.
        - Lança erros de domínio com `foccacia-errors`.

---

### 1.5. `foccacia-web-api`
**Responsabilidade:** camada HTTP lógica (handlers Express, DTOs, middleware de auth, mapeamento erro→HTTP).

- `src/foccacia-dto.mjs`
    - Converte modelos internos em respostas JSON:
        - `teamToDto(team)`
        - `playerToDto(player)`
- `src/application-to-http-errors.mjs` (a mover/renomear para aqui)
    - Middleware de erro Express (4 argumentos):  
      `sendApplicationError(err, req, res, next)`.
    - Mapeia `ApplicationError.code` → HTTP status (400, 401, 403, 404, 422, 429, 502, 500).
- `src/foccacia-web-api.mjs`
    - `verifyToken` (middleware de auth Bearer).
    - Handlers:
        - Públicos:
            - `getCompetitions(req, res)`
            - `getTeams(req, res)`
            - `createUser(req, res)`
        - Protegidos por token:
            - `getGroups`, `createGroup`, `getGroup`, `replaceGroup`,
              `deleteGroup`, `addPlayerToGroup`, `deletePlayerFromGroup`
    - Usa:
        - `foccacia-services` (regra de negócio).
        - `foccacia-errors` (auth e validações).
        - `foccacia-utils` (logs).
        - `sendApplicationError` para devolver JSON de erro.

---

### 1.6. `foccacia-server`
**Responsabilidade:** entrypoint da app, configuração do Express e definição das rotas físicas.

- `src/foccacia-server.mjs`
    - Cria `express()`.
    - `app.use(express.json())`.
    - Define paths:
        - `/competitions`
        - `/competitions/:competitionCode/seasons/:seasonYear/teams`
        - `/users`
        - `/groups`, `/groups/:groupId`
        - `/groups/:groupId/player`, `/groups/:groupId/player/:playerId`
    - Liga cada rota ao handler do `foccacia-web-api`.
    - Aplica `verifyToken` antes das rotas de grupos.
    - Regista o middleware de erro `sendApplicationError` no fim.
    - `app.listen(PORT, ...)`.

---

### 1.7. `foccacia-errors`
**Responsabilidade:** modelo de erro de aplicação, independente de Express/HTTP.

- `src/errors.mjs` (novo)
    - `ApplicationError(code, message)`.
    - `ERROR_CODES = { InvalidData, Unauthorized, NotFound, Forbidden, TooManyRequests, Unprocessable, BadGateway }`.
    - Factory functions:
        - `INVALID_DATA(msg)`, `UNAUTHORIZED(msg)`, `NOT_FOUND(msg)`, `FORBIDDEN(msg)`,
          `RATE_LIMIT(msg)`, `UNPROCESSABLE(msg)`, `BAD_GATEWAY(msg)`.
- Usado por:
    - `fapi-teams-data` (erros da Football API).
    - `foccacia-services` (erros de negócio).
    - `foccacia-web-api` (auth e validações HTTP).

---

### 1.8. Outros Modulos
- TODO

## 2. Dependências entre módulos com Dependency Injection

```mermaid

flowchart TD
    FS["foccacia-server.mjs"]
    MR["foccacia-module-resolver.mjs (createFoccaciaApp)"]

%% raiz
    FS --> MR

%% módulos principais criados pelo resolver
    MR --> App["Express app (app)"]
    MR --> Api["Web API (initWebApi)"]
    MR --> Services["Services (initServices)"]
    MR --> DataMem["Data in memory (initDataMem)"]
    MR --> Domain["Domain model (initDomainModel)"]
    MR --> Fapi["Football API wrapper (initFapiTeams)"]
    MR --> Dto["DTO mappers (initDto)"]
    MR --> ErrMw["Error middleware (initSendApplicationError)"]
    MR --> Utils["foccacia-utils (logs, json, io, helpers)"]
    MR --> Errors["foccacia-errors (ApplicationError + ERROR_CODES)"]

%% dependências internas
    Services --> DataMem
    Services --> Domain
    Services --> Fapi
    Services --> Utils
    Services --> Errors

    Api --> Services
    Api --> Dto
    Api --> Errors
    Api --> Utils

    App --> Api
    App --> ErrMw

```

## 3. Melhorias e tarefas futuras

### 3.1. Melhorias/correções no estado atual
  
---

### 3.2. Novas features para cumprir o enunciado

---

## 4. Divisão de tarefas

### Perfis

- **Dev Dinis Correia – Erros e robustez**  
  Foco em error handling, códigos HTTP, mensagens claras.

- **Dev Francisco Mendes – Refactor e modularização**  
  Foco em simplificar funções, extrair helpers, bons nomes.

- **Dev Tiago Nevoa – Arquitetura**  
  Foco em organização de módulos, dependências e alinhamento com o enunciado.

---

### 4.1. Fase 1 – Arquitetura e dependências (Tiago Nevoa)

**Done**

---

### 4.2. Fase 2 – Erros e autenticação (Dinis Correia)

---

### 4.3. Fase 3 – Refactor e regras de negócio (Francisco Mendes)

---

### 4.4. Fase 4 – Integração final e documentação

1. Dev Tiago Nevoa:
    - 
    - 
2. Dev Dinis Correia:
    - 
    - 
3. Dev Francisco Mendes:
    - 
    -
