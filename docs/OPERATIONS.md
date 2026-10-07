# Operação

## Saúde e reinício

`GET /api/health` verifica servidor/banco. `docker compose ps`, `docker compose logs --tail=100 app db` e em produção `journalctl -u cryptidle-backup.service` ajudam no diagnóstico. Nunca registrar cookies, senhas ou `.env`. Containers usam `unless-stopped`; Docker inicia via systemd. Migration é execução única antes da versão nova. Atividades do jogo são retomadas do banco ao consultar, não de timers em memória.

Limites: PostgreSQL 512 MiB, app 768 MiB, Caddy 128 MiB em host de 2 GiB. Build acontece fora da EC2. Investigar OOM em `journalctl -k`; subir tamanho do host se medição mostrar pressão. Logs JSON limitados a 3×10 MiB por serviço; app em AWS usa CloudWatch não bloqueante, 14 dias. `df -h /var/lib/docker`, `docker system df` e `free -m` devem fazer parte da rotina semanal; manter pelo menos 20% livre. Remover somente imagens antigas identificadas; nunca volumes indiscriminadamente. CloudWatch Agent instalado mas métricas de memória/disco ainda precisam configuração no ambiente real.

## Backup e prova de restauração

Em Linux/WSL com Docker Compose:

```sh
bash scripts/backup.sh
bash scripts/restore-check.sh backups/cryptidle-TIMESTAMP.dump
```

Dump PostgreSQL custom (`pg_dump -Fc`) consistente, permissão local 0600; publicação atômica só após sucesso e validação do catálogo. Sem BACKUP_BUCKET fica local. Com BACKUP_BUCKET faz upload S3 criptografado, versionado, privado; retenção remota 35 dias e local 7 dias. Timer diário 04:15 UTC com catch-up após reboot. Não há cópia contínua nem PITR: perda potencial até o último backup diário. Host tem apenas `PutObject`; leitura de backup exige credencial do operador. Monitore falhas do timer; retenção e volume devem ser ajustados ao crescimento.

`restore-check.sh` cria banco isolado de nome aleatório, restaura com erro fatal e consulta migrations, depois remove apenas esse banco de teste. Não substitui dados do jogo. O verificador PostgreSQL executado localmente também compara todas as linhas e constraints do schema real. Estado real de validação consta no MVP_CHECKLIST; não presumir execução do script Compose em sistemas sem Docker.

Validação local executada em 2026-10-06: `pnpm exec tsx scripts/verify-backup.ts` com PostgreSQL 17 nativo em 127.0.0.1:55432 passou. Também passou `scripts/verify-game-backup.ts` em `cryptidle_review_test`: dump e restauração do schema real com 13 tabelas, linhas, checksums de todas as colunas e constraints preservados. Os bancos restaurados eram isolados e descartáveis. Reproduzir configurando `DATABASE_URL` para um banco `_test` e `PG_BIN` para a pasta dos executáveis. **Docker Compose e timer/S3 não foram executados localmente** porque WSL2/virtualização não estão disponíveis. Compose normal/produção passaram `docker compose config --quiet`, e scripts passaram `bash -n`. CI inclui dump/restauração do banco real de integração.

`pnpm exec tsx scripts/verify-game-backup.ts` valida o **banco real do jogo** via DATABASE_URL, exigindo sufixo `_test`. Pare escritas antes: script cria um banco novo, restaura dump completo e compara contagem/checksum de todas colunas/linhas de todas tabelas públicas e definições de constraints. Rejeita se origem mudou durante teste. Nenhum dado de origem é modificado. PG_BIN opcional seleciona executáveis nativos; em CI PG_CONTAINER seleciona o ID do serviço Docker PostgreSQL 17 para usar ferramentas da mesma versão. Resultado executado fica registrado no checklist/evidências finais.

Recuperação real: parar app (deixar banco), fazer dump do estado atual para preservar evidências, obter backup com AWS CLI usando operador, restaurar em **novo banco**, validar contagens e integridade com aplicação isolada, só então trocar DATABASE_URL/configuração Compose para o banco restaurado e subir versão compatível. Nunca experimentar `pg_restore --clean` diretamente sobre produção. Caddy e volumes de TLS podem ser recriados; dados PostgreSQL não.

## Migrations e rollback

Deploy baixa nova imagem primeiro, salva `.env.previous`, faz backup e executa `prisma migrate deploy` antes do app. Alterações devem seguir expand/contract: adicionar estruturas compatíveis, publicar código, remover estruturas somente em outra janela. Não há down migration automática. Em falha de migration interromper deploy, consultar `_prisma_migrations`/logs e reparar sob orientação; nunca usar migrate reset em produção.

Para rollback da aplicação: identificar SHA anterior do histórico ECR, verificar compatibilidade com schema atual, atualizar APP_IMAGE e executar `docker compose -f docker-compose.yml -f compose.production.yml up -d --no-build --no-deps app`. Não executar migration antiga para tentar desfazer schema. Migration destrutiva pode exigir restauração de backup e perda documentada de progresso; planejar janela e autorização específica. `.env.previous` é segredo e deve permanecer 0600.

## Interrupção e remoção segura

Parada temporária via SSM: fazer backup, verificar upload, `docker compose -f docker-compose.yml -f compose.production.yml stop`, parar EC2 pela console/CLI. Disco, snapshots, EIP, ECR, S3 e logs continuam cobrados. Ao iniciar, IP elástico permanece; `docker compose ... up -d` após parada explícita.

Remoção permanente requer decisão do proprietário: exportar backup fora da conta, testar restauração, registrar recursos retidos, desabilitar termination protections conscientemente e executar cdk destroy. Host, disco, ECR, S3 e logs têm retenção e precisam remoção manual posterior. Proteção da stack não protege de todas as ações diretas. Só excluir volume/bucket após confirmar backup e política de retenção; não usar `docker compose down -v` nem `docker system prune --volumes`.

## Incidentes básicos

Falha de login: conferir APP_ORIGIN/HTTPS, cookie e relógio servidor, sem expor sessões. Falha de compra: revisar auditoria e transação; não compensar gold manualmente sem prova. Falha de banco: parar escritas, preservar volume, restaurar cópia isolada. Falha de deploy: app anterior permanece até troca; após falha de health fazer rollback compatível. Disco cheio: preservar banco/backups, limpar logs/imagens conhecidos e ampliar EBS conforme guia AWS; não apagar WAL. Credencial comprometida: restringir acesso, rotacionar segredo e invalidar sessões afetadas.
