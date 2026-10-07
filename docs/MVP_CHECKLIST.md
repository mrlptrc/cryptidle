# Checklist verificável

Atualizado em 2026-10-06. [x] itens foram demonstrados na sessão; [ ] dependem de execução externa ou host compatível.

- [x] Repositório inicial continha apenas README; branch `feat/cryptidle-mvp`; plano e contratos registrados.
- [x] `pnpm install --frozen-lockfile` passou; setup local sem Docker validado em PostgreSQL 17 nativo.
- [ ] Clone em uma pasta limpa ainda não foi repetido.
- [x] Cadastro, login, logout e duas contas persistidas — testes PostgreSQL e navegador.
- [x] Três classes, três regiões/nove monstros, 24 equipamentos, progressão de nível 1–20.
- [x] Caça autoritativa online/offline, teto de 8h, liquidação, teste de duas abas e sem repetir recompensas.
- [x] Inventário, equipamento, poções compradas/consumidas e skins desbloqueáveis.
- [x] Arte integrada: quatro cenários, 16 spritesheets (3 classes × 2 skins, 9 monstros e boss), oito ícones; idle/movimento/ataque/derrota; feedback visual.
- [x] Mercado: pesquisa, anúncio, cancelamento, auditoria, compra concorrente e corrida compra/cancelamento testados.
- [x] Boss automático 2–4: browser com duas contas; teste de recriação do servidor, reconexão e recompensa única.
- [x] Presença, chat com rate limit persistente e ranking.
- [x] Núcleo: 9/9 testes. Integração PostgreSQL 17: 14/14. E2E Chromium: 1/1 e console sem erros.
- [x] `pnpm install --frozen-lockfile`, lint, typecheck e build. Frontend JS 1,434 MB (403 kB gzip); backend bundle 37,3 kB.
- [x] CDK synth, teste CDK 1/1, configuração Compose e sintaxe dos scripts shell.
- [x] Restauração isolada do banco real de jogo: 13 tabelas, checksum de todas as linhas e constraints preservados.
- [x] Documentação obrigatória, screenshots reais 1366×768/1920×1080/390×844, manifest de assets e registro de licenças.
- [x] Quickstart: Prisma Client, migrations, health da API e Vite validados via PostgreSQL 17 local.
- [ ] Workflow GitHub Actions executado no GitHub. Workflow criado e etapas de validação executadas localmente.
- [ ] Runtime Docker Compose executado: indisponível neste host por WSL2/virtualização desligados; arquivos YAML e build foram validados.
- [ ] AWS provisionada e URL verificada. Exige autorização separada; nenhum recurso AWS foi criado.

## Evidências da validação local

- `pnpm test`: 9 testes passaram.
- `pnpm test:integration`: 14 testes passaram em `cryptidle_review_test`, PostgreSQL 17 real em `127.0.0.1:55432`.
- `pnpm test:e2e`: duas contas concluíram cadastro, caça offline, equipamento, mercado, chat, skin e boss em Chromium; último run passou em 38,4s.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: passaram.
- `pnpm --filter @cryptidle/infra test`: 1 teste passou; `pnpm infra:synth`: passou sem provisionar.
- `scripts/verify-game-backup.ts`: todas as 13 tabelas restauradas e comparadas por contagem/checksum/constraints.
- `pnpm simulate`: resultados em `docs/evidence/balance.json`; simulação não é playtest.
- Screenshots em `docs/evidence/`: cidade, caça, inventário, boss, desktop 1920 e mobile.

## Pendências externas

CI remoto, execução de Docker Compose num host com virtualização e qualquer operação AWS. Não confundir síntese CDK com provisionamento ou deploy.
