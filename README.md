# Cryptidle

RPG idle multiplayer de fantasia medieval sombria, feito para jogar com amigos. Escolha uma classe, cace nos arredores de Cinzabrasa, encontre equipamento e reúna um grupo para enfrentar o Guardião do Eclipse. Caça e expedições são calculadas no servidor e persistem no PostgreSQL; fechar o navegador não interrompe a jornada.

## Capturas reais

Capturadas pelo fluxo Playwright em desktop: [cidade 1366×768](docs/evidence/town-1366.png), [caça 1366×768](docs/evidence/hunt-1366.png), [inventário 1366×768](docs/evidence/inventory-1366.png), [boss 1366×768](docs/evidence/boss-1366.png), [cidade em 1920×1080](docs/evidence/hunt-1920.png) e [interface móvel 390×844](docs/evidence/mobile-390.png). Resultado da simulação: [balance.json](docs/evidence/balance.json). Não são mockups.

## MVP

Cadastro, login/logout e sessão por cookie; Guerreiro, Mago e Sacerdote; três regiões e nove monstros; progressão nível 1–20; caça persistente com até oito horas offline; poções compradas e consumidas; 24 equipamentos com atributos/raridades e IDs únicos; skins desbloqueadas por conquista; mercado com compra e cancelamento transacionais; expedição recuperável com dois a quatro jogadores; presença, chat limitado e ranking. Artes de cenários originais e spritesheets de personagens/monstros estão integradas.

## Requisitos

Node.js 24, pnpm 10.24, PostgreSQL 17 e Python 3.10+ com Pillow 12.3 para regenerar sprites. Docker Compose está incluído, mas o motor Docker não é necessário para executar localmente se PostgreSQL já estiver disponível. Licença final do projeto pertence ao proprietário; consulte [licenças e dependências](docs/THIRD_PARTY_LICENSES.md).

## Quickstart local sem Docker

1. Clone o repositório e instale o pnpm 10.24 (`corepack prepare pnpm@10.24.0 --activate`).
2. Inicie um PostgreSQL 17 local e crie banco e usuário. Exemplo: `createdb cryptidle` após autenticar.
3. `Copy-Item apps/server/development.env.example apps/server/.env`; ajuste `DATABASE_URL` para seu banco e `APP_ORIGIN=http://localhost:5173`. Gere um segredo com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` e coloque em `BETTER_AUTH_SECRET` no arquivo local.
4. `pnpm install` e `pnpm db:generate`.
5. `pnpm db:migrate` e `pnpm dev`.
6. Abra http://localhost:5173, crie uma conta e personagem. A caça, drops e atividades ficam no PostgreSQL.

Em ambiente Compose, `Copy-Item .env.example .env`, troque os valores fictícios por outros aleatórios e rode `docker compose --env-file .env -f docker-compose.yml -f compose.development.yml up --build`. O jogo fica em http://localhost:3000. Compose executa migrations antes do servidor, mantém o volume `cryptidle-database` e não publica a porta do banco na configuração de produção. O motor Docker Desktop deve estar instalado e ativo.

## Comandos

`pnpm dev` inicia API e Vite; `pnpm build`, `pnpm lint`, `pnpm typecheck` validam o monorepo; `pnpm test` executa testes do núcleo; `pnpm test:integration` exige `DATABASE_URL` terminando em `_test` e pode limpar esse banco; `pnpm test:e2e` também exige o banco isolado `cryptidle_test`, inicia backend/frontend e pode criar contas/dados de teste. Nunca aponte testes a um banco de jogo.

`pnpm simulate` reproduz o balanceamento e atualiza `docs/evidence/balance.json`. `pnpm --filter @cryptidle/infra test` verifica invariantes CDK; `pnpm infra:synth` sintetiza CloudFormation sem provisionar. `pnpm exec tsx scripts/verify-game-backup.ts` exige um banco `_test`, executa dump/restore isolado do schema real e compara linhas/constraints; `PG_BIN` pode indicar a pasta dos utilitários PostgreSQL.

## Arquitetura e estado

Leia [arquitetura](docs/ARCHITECTURE.md), [design](docs/GAME_DESIGN.md), [arte](docs/ART_GUIDE.md), [desenvolvimento local](docs/LOCAL_DEVELOPMENT.md), [AWS](docs/AWS_DEPLOY.md), [operações](docs/OPERATIONS.md), [segurança](docs/SECURITY.md), [checklist verificável](docs/MVP_CHECKLIST.md) e [roadmap](docs/ROADMAP.md). O estado atual e evidências de testes/deploy constam no checklist. AWS não foi provisionada. Nenhum deploy foi realizado; exige autorização explícita.

## Limites conhecidos

MVP privado com economia fictícia, serialização global de ações econômicas, chat global simples e arte de sprite pequena sobre cenários detalhados. Presença some quando o processo reinicia. Não há recuperação de senha por e-mail, pets, trocas, leilões, PvP, temporadas, RDS ou alta disponibilidade. Banco e app juntos numa instância AWS seriam um ponto único de falha. Confira pendências reais no checklist.
