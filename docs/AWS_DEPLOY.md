# AWS: implantação privada do MVP

**Nenhum recurso AWS foi provisionado.** Synth e testes locais são validações distintas de deploy real. Somente executar bootstrap/deploy depois da autorização do proprietário. Não pressupomos free tier.

## Arquitetura

CDK cria VPC de uma AZ sem NAT Gateway, EC2 `t3.small` Linux x86 (2 GiB), Elastic IP, disco gp3 criptografado de 30 GiB, ECR imutável, S3 privado/versionado de backups, CloudWatch Logs com 14 dias, IAM/SSM e papel GitHub OIDC. Somente 80/443 entram no security group; não há chave ou porta SSH. PostgreSQL fica na rede Docker, sem porta pública. Acesso administrativo: Session Manager.

Aplicação e banco na mesma máquina reduzem custo e criam ponto único de falha. Um disco retido não substitui backup. Caminho futuro: RDS PostgreSQL privado, migração via dump/restauração numa janela, `DATABASE_URL` atualizado e desligamento do banco local após validação. Não há alta disponibilidade nesta entrega.

## Preparação (não executada)

Requer AWS CLI autenticado temporariamente, conta e domínio próprios. Instale pnpm/Node conforme README. Use `pnpm --filter @cryptidle/infra synth` para CloudFormation sem criar recursos. CLI e biblioteca CDK têm numeração independente, versões no lockfile. [Suporte Node/CDK](https://docs.aws.amazon.com/cdk/v2/guide/node-versions.html).

Após autorização explícita:

```sh
cd infra
pnpm exec cdk bootstrap aws://ACCOUNT/us-east-1
pnpm exec cdk diff -c region=us-east-1
pnpm exec cdk deploy -c region=us-east-1 -c budgetEmail=owner@example.com -c budgetUsd=30
```

Região, instanceType, githubRepository, environment, budgetEmail/budgetUsd são contextos CDK. Se já houver provider OIDC GitHub na conta, passe `-c oidcProviderArn=ARN_EXISTENTE`. Bootstrap cria recursos adicionais faturáveis; revise o diff. Nunca aceite substituição do host sem backup/restauração planejados. Stack tem termination protection; EC2 tem API termination protection, `Retain` e disco `DeleteOnTermination=false`.

Crie `/cryptidle/runtime-env` no SSM Parameter Store como **SecureString**, sob a chave AWS padrão de SSM; não coloque segredos em contexto CDK ou GitHub vars. Valor multiline dotenv, sem aspas/shell/metacaracteres, senhas aleatórias URL-safe:

```dotenv
POSTGRES_PASSWORD=GENERATE_RANDOM_URL_SAFE_VALUE
BETTER_AUTH_SECRET=GENERATE_DIFFERENT_RANDOM_VALUE_AT_LEAST_32_CHARACTERS
APP_ORIGIN=https://game.example.com
DOMAIN=game.example.com
ACME_EMAIL=owner@example.com
AWS_REGION=us-east-1
LOG_GROUP=OUTPUT_LogGroup
BACKUP_BUCKET=OUTPUT_BackupBucket
NODE_ENV=production
OFFLINE_CAP_HOURS=8
BOSS_COOLDOWN_MINUTES=15
```

Permissões para **escrever** o parâmetro pertencem ao operador, não ao CI ou jogo. Host só lê esse parâmetro. Acesso SSM à máquina implica acesso a segredos: restrinja operadores. Se usar KMS próprio, acrescente `kms:Decrypt` exclusivamente na chave escolhida. Rotação de senha do PostgreSQL exige `ALTER ROLE` e parâmetro coordenados; trocar variável não altera usuários já existentes.

DNS A do domínio aponta ao output PublicIp. Caddy solicita HTTPS automaticamente quando DNS e portas 80/443 estão corretos; reverse_proxy suporta WebSocket. Não declare HTTPS funcional antes de verificar o endereço real.

## GitHub OIDC e deploy autorizado

Crie environment `production` com revisores obrigatórios e restrição de branch `main` antes de habilitar deploy. Vars desse environment: `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN` (output DeployRoleArn), `ECR_REPOSITORY` (output RepositoryUri), `INSTANCE_ID` (output InstanceId). Não armazenar AWS access keys.

Trust policy exige aud `sts.amazonaws.com` e sub exato `repo:mrlptrc/cryptidle:environment:production`. [Condições OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html). O papel só envia imagem ao ECR específico e comandos SSM para a instância/documento específicos; `GetCommandInvocation` requer wildcard. Enviar comando ao host é privilégio administrativo, por isso o environment protegido é obrigatório. PRs executam CI sem credenciais de produção; deploy é manual, apenas main.

Workflow constrói imagem da revisão, publica tag SHA imutável, entrega pequeno bundle operacional via SSM, busca segredos no host, faz backup, migration forward, sobe aplicação e verifica `/api/health`. Dados persistem em volume nomeado `cryptidle-database`; `docker compose down -v` é proibido em produção. A primeira execução não tem banco anterior para backup. Repetir publicação do mesmo SHA é rejeitado por ECR imutável: para repetir só a instalação use SSM com a imagem existente.

Ações de CI e imagens base estão versionadas; lockfile fixa dependências JS. Atualizar pins deliberadamente, revisar release notes e vulnerabilidades. Imagem runtime inclui ferramentas de migration e dependências de build por simplicidade; reduzir imagem é melhoria posterior.

## Custos estimados

Consulta em **2026-10-06**, região **us-east-1**, Linux on-demand, 730 h/mês, 30 GiB gp3, um IPv4. A fonte AWS de T3 consultada mostra aproximadamente US$0,0209/h para t3.small (~US$15,26/mês); gp3 US$0,08/GiB (~US$2,40); IPv4 US$0,005/h (~US$3,65). Subtotal orientativo **~US$21,31/mês** antes de backups, logs, ECR, transferência, snapshots, requests, domínio, DNS, impostos/câmbio e serviços bootstrap. Valores podem variar; confirme na calculadora AWS na autorização. Créditos CPU excedentes dependem da configuração T3 e uso.

Fontes oficiais: [EC2 T3](https://aws.amazon.com/ec2/instance-types/t3/), [EBS](https://aws.amazon.com/ebs/pricing/), [IPv4/VPC](https://aws.amazon.com/vpc/pricing/). Reserva operacional sugerida de US$30–40 é premissa, não garantia. O orçamento opcional considera a conta inteira, alerta em 80% do valor mensal e **não bloqueia gastos**. Sem budgetEmail não há alerta por email. Alarme CPU fica no CloudWatch sem destinatário; configurar ações e alarmes de disco/memória após aferir carga.

## Validação que exige AWS

Pendente: provisionamento, AMI/bootstrap, login OIDC, DNS/ACME, health público, WSS, restart real, CloudWatch, timer S3, download/restauração de backup e notificações. Synth não prova esses comportamentos. Após deploy autorizado verificar duas contas no URL, reiniciar host via SSM, confirmar persistência e executar restauração isolada conforme OPERATIONS.
