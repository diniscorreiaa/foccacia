# Estrutura da Aplicação

Uma aplicação modular Node.js para gestão de dados de futebol com interfaces duplas (API + Website).

## Módulos Principais da Aplicação

### `foccacia-server` (Ponto de Entrada)

Servidor Express principal que comanda toda a aplicação. Configura middlewares, autenticação (Passport com sessões) e
motor de views (Handlebars).

### `foccacia-module-resolver` (Injeção de Dependências)

Módulo central que inicializa e conecta todas as dependências. Cria instâncias do modelo de domínio, camadas de dados,
serviços e routers, o que garante a injeção correta de dependências na aplicação.

### `foccacia-services` (Lógica de Negócio)

Camada central de lógica de negócio contendo regras de validação, verificações de autorização e orquestração. Lida com
operações de gestão de utilizadores, operações de grupos e integra chamadas de API externas com persistência de dados.
É no neste módulo onde é feita a esmagadora maioria do tratamento de erros.

## Módulos de Camada de Dados

### `fapi-teams-data` (Integração com API Externa)

Processa comunicação com a Football Data API (https://api.football-data.org). Gere caching, limites de taxa e transforma
respostas da API externa em modelos de domínio.

### `foccacia-db` (Persistência - ElasticSearch)

Camada de dados que utiliza ElasticSearch para armazenar dados persistentemente. Processa operações CRUD (Create, Read,
Update, Delete) para utilizadores e
grupos com indexação, pesquisa e gestão de documentos.

### `foccacia-data-mem` (Armazenamento em Memória)

Implementação de armazenamento de dados volátil em memória para desenvolvimento/testes. Fornece a mesma interface que a
camada persistente mas armazena dados apenas em memória durante a execução.

---

## Módulos de Camada de Apresentação

### `foccacia-web-api` (REST API)

Router Express que expõe endpoints RESTful para clientes externos. Processa autenticação via tokens Bearer,
transformação de requests/responses (DTOs) e delega para serviços.

### `foccacia-web-site` (Website Renderizado no Servidor)

Router Express para páginas web renderizadas no servidor usando templates Handlebars. Gere sessões de utilizador,
submissões de formulários e fornece interface web para gerir grupos e jogadores.

### `views/` (Templates)

Templates Handlebars (.hbs) para renderização no servidor. Inclui o template principal e layouts específicos de páginas
para a interface web.

---

## Módulos de Suporte e Utilidades

### `foccacia-utils` (Utilitários Partilhados)

Coleção de funções utilitárias incluindo logging (info, sucesso, erro), operações de ficheiros I/O, processamento JSON,
resolução de caminhos e helpers de conversão/validação de tipos.

### `foccacia-errors` (Gestão de Erros)

Definições centralizadas de erros e mapeamento de códigos. Fornece objetos de erro consistentes que podem ser traduzidos
para códigos de estado HTTP e mensagens apropriadas.

### `foccacia-domain-model` (Modelo de Domínio)

Define as entidades de negócio centrais (Competition, Team, Player, User, Group) como construtores. Fornece o plano
estrutural para todos os objetos de dados usados em toda a aplicação.

---

## Princípios Arquiteturais

### Autenticação Dupla

- **Baseada em Sessão**: Para utilizadores do website (Passport + express-session)
- **Baseada em Token**: Para clientes da API (tokens Bearer)

### Flexibilidade de Armazenamento

- **Memória**: Armazenamento rápido e volátil para testes (`foccacia-data-mem`)
- **ElasticSearch**: Armazenamento persistente e pesquisável para produção (`foccacia-db`)

### Separação Clara de Responsabilidades

1. **Camada de Apresentação**: `web-api`, `web-site`, `views`
2. **Camada de Negócio**: `services`
3. **Camada de Dados**: `db`, `data-mem`, `fapi-teams-data`
4. **Infraestrutura**: `utils`, `errors`, `domain-model`

### Fluxo de Dados

## Request flow

```mermaid

flowchart LR
    browser["Browser"] -->|" HTTP + cookies "| server["Server\n(foccacia-server)"]
    server --> store[("Session Store\n(FileStore)")]
    server --> session["Sessions\n(express-session)"]
    session --> passport["Auth\n(Passport)"]
    passport -. " req.user / req.isAuthenticated() " .-> site["Website\n(foccacia-web-site)\nSSR Handlebars"]
    passport -. " req.user / req.isAuthenticated() " .-> api["API\n(foccacia-web-api)\nJSON"]
    site --> services["Services\n(foccacia-services)"]
    api --> services
    services --> fapi["Football Provider\n(fapi-teams-data)"]
    services --> db["Data Provider\n"]
    fapi --> football{{"Football Data API"}}
    db --> elastic[("ElasticSearch\n(foccacia-db)")]
    db --> mem[("Data in Memory\n(foccacia-data-mem)")]
    api -. " Authorization: Bearer " .-> bearer["Bearer token"]
```

## Dependency Injection (DI)

```mermaid

flowchart TB
    server["Server\n(foccacia-server)"] --> resolver["DI Root\n(foccacia-module-resolver)"]
    resolver --> site["Website\n(foccacia-web-site)"]
    resolver --> api["API\n(foccacia-web-api)"]
    site --> services["Services\n(foccacia-services)"]
    api --> services["Services\n(foccacia-services)"]
    services --> db["Data Provider\n"]
    services --> fapi["Football Provider\n(fapi-teams-data)"]
    services --> errors["Errors\n(foccacia-errors)"]
    fapi --> football{{"Football Data API"}}
    fapi --> domain["Domain Model\n(foccacia-domain-model)"]
    fapi --> utils["Utils\n(foccacia-utils)"]
    db --> elastic[("ElasticSearch\n(foccacia-db)")]
    db --> mem[("Data in Memory\n(foccacia-data-mem)")]
    db --> domain["Domain Model\n(foccacia-domain-model)"]
    db --> utils["Utils\n(foccacia-utils)"]
```

# Data storage design (i.e. in ElasticSearch), namely: index or indices; document properties; relations between documents, if exit; etc.

No nosso projeto temos à escolha 2 módulos disponíveis para guardar dados,
o foccacia-data-mem, um solução memory only, e o foccacia-db, que utiliza a base de dados ElasticSearch para guardar
dados de forma persistente. Para escolher a implementação que queremos, é só alterar no module-resolver a data que é
injetada no services.

Ambas estas soluções entregam dados de volta ao services de acordo com o domain model.

# Description of the mapping between the ElastictSearch’s FOCCACIA documents and the web application objects model.

# Documentação da API

Nós documentamos a nossa api recorrendo à específicação OpenAPI 3.0.1, a qual pode ser visualizada no diretamente
ficheiro
[foccacia-api-spec.yaml](foccacia-api-spec.yaml), ou de forma interativa e visual por um browser pelo
ficheiro [foccacia-api-spec.html](foccacia-api-spec.html) (gerado
com [openapi-generate-html](https://github.com/qazsato/openapi-generate-html?tab=readme-ov-file)).

# Execução e Testes

## Requisitos

- Node.js >= 18
- npm >= 9
- Docker (para ElasticSearch)
- Ambiente: WSL/Ubuntu recomendado para scripts fornecidos

## Configuração

### 1) Football Data API token

Criar o ficheiro:

- `docs/input/headers.json`

Com o conteúdo:

```json
{
  "X-Auth-Token": "COLOCA_AQUI_O_TEU_TOKEN"
}
```

### 2) ElasticSearch (Docker)

Criar/ligar o container docker do Elasticsearch:

```sh
npm run docker:up
```

Se quiser pará-lo:

```sh
npm run docker:down
```

se quiser limpar os volumes do Elasticsearch:

```sh
npm run docker:down:clean
```

## Instalação

Instalar as dependências utilizadas pelos diversos módulos:

```sh
npm install
```

## Executar

Para executar a aplicação faça:

```sh
npm start
```

## Utilização

Quando a aplicação estiver a correr, poderá utilizar o [website](http://localhost:1904/), interagir
com a API, com o URI <http://localhost:1904/api/>, e fazer pedidos diretamente ao Elasticsearch pelo
URL <http://localhost:9200/>.

## Testes

Executar todos:

```sh
npm run test:all
```

## Coverage

Gerar coverage de todos:

```sh
npm run coverage:all
```
