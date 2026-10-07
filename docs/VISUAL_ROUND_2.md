# Rodada visual 2

## Leitura do código existente

- A cena Phaser já era montada uma vez e recebia o estado React por `ref`, mas animava uma troca genérica entre jogador e monstro a cada 2,3 s. Isso não correspondia a golpes observados no servidor.
- Os encontros eram resolvidos integralmente pelo núcleo do jogo. O contrato expunha duração restante e um HP previsto do jogador, mas não HP ou identidade sequencial do monstro. Recompensas e resultado futuro eram escondidos na API.
- A interface tinha textos pequenos, atributos sem formatação, toast central e inventário em lista longa.
- `pnpm dev`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build` e `pnpm lint` já existiam.

## Estado e animação

O encontro agora inclui uma sequência monotônica por personagem, HP máximo e HP restante do monstro. Durante o progresso parcial, o servidor atualiza esse HP a partir do tempo restante persistido. A cena anima aproximação curta e golpe quando observa a sequência/HP mudarem; os números flutuantes vêm da diferença de HP retornada pela API. Resultado, XP, gold e itens ainda são decididos e concedidos pelo servidor ao liquidar o encontro. Críticos e curas de combate por golpe não existem no modelo atual e não são inventados na tela.

O combate continua agregado no servidor, sem simulação de cada frame do golpe. O HP do monstro apresentado durante o encontro é uma aproximação temporal servidora, não um evento independente de hitbox. `sequence` e HP persistidos evitam repetir a animação ao re-renderizar ou reconectar; ao retornar de uma aba oculta, a cena recebe apenas o último estado e não reexecuta ticks antigos.

Animação base de Phaser em 960×600; imagens novas usam células fixas de **160×112** a escala 1×, pivô `(0.5, 0.88)` e fundo RGBA transparente. O atlas original gerado é 1536×1024 (4×4); `assets/slice_forest_atlas.py` mantém proporção, recorte e base alinhada. Guerreiro e monstros terrestres apoiam no mesmo plano; o morcego tem posição mais alta e flutuação leve. Pausa de renderização ao ocultar a aba e suporte a `prefers-reduced-motion` foram adicionados.

## Arte e alcance

O atlas do Guerreiro, Rato da cripta, Lodo espectral e Morcego sombrio foi criado com ImageGen para esta rodada e inspecionado; o manifest registra prompt e procedência. O corte revelou uma pequena quantidade de pixels semitransparentes cruzando limites de linha. O recortador remove esses resíduos dos dois rows centrais, fixa quatro frames e verifica dimensões e transparência. As peças novas substituem as sprites pequenas apenas para o Guerreiro de skin inicial e os três monstros de Bosque das Cinzas.

As outras classes e regiões ainda usam sprites programáticos de baixa resolução do MVP. Boss, mercado e expedição não foram redesenhados. Typecheck, lint, build, 11 testes do núcleo e 14 testes PostgreSQL passaram. O navegador recusou explicitamente a inspeção automatizada de `localhost`; portanto não há screenshot “depois” nem validação visual real da página nesta rodada. A página a 1366×768, 1920×1080 e 390×844, a caça contínua por dois minutos e os fluxos de interação listados no checklist continuam pendentes. As folhas novas foram inspecionadas localmente.
