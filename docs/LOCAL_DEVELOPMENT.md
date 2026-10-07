# Desenvolvimento local

Node 24, pnpm 10.24, PostgreSQL 17. `corepack prepare pnpm@10.24.0 --activate`; clone limpo; copiar `apps/server/development.env.example` para `apps/server/.env`, definir segredo aleatório longo e `DATABASE_URL`. Esse caminho é lido pelo servidor Node e pelas migrations Prisma. Para Vite em 5173, `APP_ORIGIN=http://localhost:5173`; cookies locais não usam Secure. O backend e o frontend rodam no mesmo computador. `.env` não entra no Git. Para Compose, a configuração separada fica na raiz: copie `.env.example` para `.env`.

1. `pnpm install` (lockfile obrigatório; CI usa `--frozen-lockfile`).
2. `pnpm db:generate` para gerar Prisma Client.
3. `pnpm db:migrate` aplica somente migrations pendentes.
4. `pnpm dev`; abrir http://localhost:5173.
5. Para produção compilada local: `pnpm build`, definir `WEB_DIST=apps/web/dist`, executar migrations e `pnpm --filter @cryptidle/server start`.

Compose: `docker compose --env-file .env -f docker-compose.yml -f compose.development.yml up --build`; `docker compose down` preserva volume. Não executar `down -v` em dados que deseja manter.

Seeds fixos não são necessários. Testes de integração truncam o banco `_test`; E2E cria contas e itens. Use banco inteiramente descartável como `cryptidle_test` e `DATABASE_URL` com nome terminando em `_test`. Ambiente de produção recusa flags/test hooks; simulação não conecta ao DB. E2E inicia builds locais na porta 3000 e Vite 5173. `pnpm exec playwright install chromium` instala o navegador na primeira execução.

O atalho de relógio existe apenas na camada de fixture E2E/teste: os testes avançam timestamps no PostgreSQL isolado. Não há rota de tempo de debug. `pnpm simulate` usa sementes determinísticas para comparar classes em 120 minutos; não representa playtest.

Assets: `python assets/generate_sprites.py` recompõe spritesheets/ícones programáticos com Pillow. Cenários gerados são arquivos finais versionados e não dependem de API em runtime.

## Diagnóstico

- `BETTER_AUTH_SECRET` deve ter pelo menos 32 caracteres.
- Confira `APP_ORIGIN` igual à origem do navegador, `DATABASE_URL`, e `pnpm db:migrate` se login/API retornarem 500.
- Prisma usa schema em `apps/server/prisma/schema.prisma`; erro de client: `pnpm db:generate`.
- Porta 3000 ocupada: pare o outro servidor. Vite usa proxy `/api` e WebSocket para ela.
- Browser sem sprites: confira arquivos em `apps/web/public/art` e caminhos `/art/*`.
- WebSocket exige mesma origem e sessão válida. Vite proxy encaminha WSS/dev WS.
- `OFFLINE_CAP_HOURS` pode reduzir o teto, máximo 24 horas.
- `docker version` deve mostrar Server ativo; cliente instalado sozinho não inicia Compose.
- Não coloque cookies, senhas, tokens, payloads de login ou connection strings em issue/log compartilhado.
