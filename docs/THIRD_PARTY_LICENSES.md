# Dependências e licenças

O proprietário ainda precisa escolher a licença do código e das artes originais do Cryptidle. Nenhuma licença definitiva é atribuída ao projeto por esta entrega. Não confundir licenças das dependências com licença do projeto.

Inventário completo instalado em 2026-10-06: [DEPENDENCIES.json](DEPENDENCIES.json), gerado de `pnpm licenses list --json`, contendo dependências diretas e transitivas e suas versões. O lockfile é a fonte de resolução. Declarações abaixo foram lidas dos metadados dos pacotes instalados; uma distribuição deve preservar seus arquivos LICENSE/NOTICE quando exigido. A imagem Docker inclui node_modules com esses arquivos; não os remover em otimizações futuras.

| Componente | Licença declarada |
| --- | --- |
| React / React DOM, Phaser, Vite | MIT |
| Fastify e plugins, Better Auth, Zod | MIT |
| Prisma Client / CLI | Apache-2.0 |
| AWS CDK CLI / lib, constructs | Apache-2.0 |
| TypeScript, Playwright | Apache-2.0 |
| Vitest, ESLint, esbuild, tsx | MIT |
| PostgreSQL (imagem de banco) | PostgreSQL License |
| Caddy (proxy) | Apache-2.0 |
| Node.js | MIT e licenças de componentes incluídos |
| Debian / Alpine / Amazon Linux | Conjunto de licenças dos pacotes do sistema |

Transitivos também incluem ISC, BSD-2-Clause, BSD-3-Clause, Python-2.0 e BlueOak-1.0.0. O conjunto de dados **caniuse-lite**, versão registrada no inventário, é de Ben Briggs e contribuidores e deriva dos dados Can I Use: [projeto](https://github.com/browserslist/caniuse-lite), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). É dependência de ferramentas de build; nenhuma alteração desses dados foi feita neste projeto. `argparse` declara Python-2.0.

Artes do jogo: procedência e arquivos em [assets/manifest.json](../assets/manifest.json); não são imagens do PokeIdle. Não há personagens, código ou marcas copiados da referência. Prompts de geração, quando usados, pertencem ao manifesto. PokeIdle é somente referência conceitual, não dependência distribuída.

Atualizações de dependências exigem regenerar inventário e revisar mudanças de licença. Esta lista não certifica conformidade jurídica de uma distribuição futura.
