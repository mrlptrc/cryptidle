# Plano de execução

Estado inicial verificado em 2026-10-06: somente README, commit f92035e; sem alterações locais. Branch feat/cryptidle-mvp. Nenhum AGENTS.md ancestral ou no repositório.

1. Registrar contratos, stack e criar monorepo.
2. Integrar autenticação real, personagem, caça, inventário e persistência PostgreSQL.
3. Validar núcleo determinístico, limite offline, liquidação e concorrência.
4. Integrar React/Phaser, assets originais reutilizáveis, animação e skins.
5. Mercado transacional, expedição persistente, chat/presença/ranking.
6. Compose, backups, CI e CDK sem provisionamento.
7. Testes PostgreSQL/E2E, inspeção visual, correções e documentação com evidências.

## Contratos e divisão

- Coordenador: workspace, packages/shared, packages/game-core, integração e validação.
- Agente servidor: apps/server incluindo Prisma, testes de integração e API; consome contratos compartilhados.
- Agente interface: apps/web e assets; consome API abaixo, não calcula recompensas.
- Agente infraestrutura: infra, Dockerfiles/Compose, .github, operação e documentação AWS.
- Agentes não fazem commits; coordenador revisa e organiza commits.

## API v1

Mesma origem. Better Auth em /api/auth/* (sign-up/email {email,password,name}, sign-in/email {email,password}, sign-out; get-session). Cookie HttpOnly. API do jogo exige sessão. POST JSON com Origin confiável e cabeçalho Idempotency-Key UUID para mutações econômicas; erros {error:string}.

GET /api/content → {classes,regions,equipment,skills,config} dos exports game-core.
GET /api/state → {character: Character|null,items: Item[],summary: RewardSummary|null,room: BossRoom|null,serverTime:number}. Liquida caça atomicamente e retorna resumo deste intervalo. 
POST /api/character {name,classId}; POST /api/hunt {regionId:string|null}; POST /api/build {skills:string[],potionThreshold:number}; POST /api/equip {itemId:string,equip:boolean}; POST /api/sell {itemId}; POST /api/potions {quantity:number}; POST /api/skin {skin:0|1}. Retornam estado.
GET /api/market?name=&rarity=&slot= → {listings: Listing[]}; POST /api/market {itemId,price}; POST /api/market/:id/buy {}; POST /api/market/:id/cancel {}.
POST /api/boss/create {}; POST /api/boss/join {code}; POST /api/boss/ready {ready:boolean,preparation:'balanced'|'attack'|'guard'}; POST /api/boss/start {}; POST /api/boss/leave {}. Retornam estado. GET /api/boss → {room:BossRoom|null}.
GET /api/ranking → {characters: Array<{id,name,classId,level,xp}>}; GET /api/chat → {messages:ChatMessage[]}; POST /api/chat {text} → {message:ChatMessage}.
WS /api/ws recebe {type:'presence',players:PlayerPresence[]} e {type:'chat',message:ChatMessage} e {type:'refresh'}; cliente reconsulta state/boss e reconecta. Presença efêmera, atividades persistidas.

Nomes JSON camelCase. Datas públicas em epoch ms. Estado de domínio em packages/shared/src/index.ts. Conteúdo e funções puras em packages/game-core/src/index.ts.

## Decisões iniciais

Node 24 LTS, pnpm 10.24; TypeScript ESM; React/Vite/Phaser; Fastify 5; Better Auth com adaptador Prisma; PostgreSQL 17; Prisma 6.19 (API estável e suporte Node 24, evitando migração v7 de configuração nesta primeira entrega). Versões exatas registradas em package.json e lockfile após consulta oficial.

Caça por encontros determinísticos, sem ticks por segundo. Resultado fixado no começo de cada encontro com snapshot válido, tempo consumido em blocos de combate; limite de 8h desde última liquidação e no máximo 1600 encontros. Todas as mutações liquidam progresso em transação sob advisory lock global. Mercado serializa transferência e cancelamento no mesmo lock compartilhado. Boss persiste snapshots e resultado planejado no início, conclui no horário do servidor com recibo único por participante. Detalhes e evidências finais em GAME_DESIGN e MVP_CHECKLIST.

Sem AWS provisionada ou publicação autorizada. Licença definitiva pertence ao proprietário.
