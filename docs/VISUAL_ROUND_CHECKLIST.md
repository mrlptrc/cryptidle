# Rodada visual 2 — checklist

- [x] Inspecionar instruções, cena Phaser, contrato de estado, regras de combate, interface e comandos existentes.
- [x] Produzir e inspecionar o atlas de referência; cortar quatro sheets RGBA fixos (4 frames de 160×112) e verificar transparência e pivôs.
- [x] Produzir e inspecionar folhas 2D pixel art detalhadas do Guerreiro e morcego (96×144, 6 quadros por ação, RGBA transparente).
- [x] Expor sequence e HP do monstro calculados pelo servidor; animações e texto de dano observam mudanças de estado retornadas, sem conceder recompensas no frontend.
- [x] Melhorar leitura do encontro, feedback de habilidade ativa, histórico limitado, legibilidade, notificações e inventário em grade com comparação e ações existentes.
- [x] Aplicar a cena Phaser reutilizável; folhas novas integradas ao Guerreiro e morcego do Bosque das Cinzas, com sombra de contato e ações separadas.
- [x] Ativar renderização nearest-neighbour no canvas para manter leitura pixelada ao ampliar a cena.
- [x] Typecheck, lint, build, 11 testes do núcleo, 14 testes PostgreSQL e `git diff --check` passaram.
- [ ] Conferência visual da página a 1366×768, 1920×1080 e 390×844; 2 minutos de caça; abrir/fechar inventário, equipar/desequipar, trocar região, parar/retomar, recarregar e retornar de aba inativa. O navegador recusou acesso automatizado a localhost, então essas verificações estão pendentes.
- [x] Atualizar manifest e documentação do padrão; screenshots “depois” não puderam ser capturados porque o navegador bloqueou localhost. As folhas novas foram inspecionadas diretamente.
