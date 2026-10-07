# Auditoria de conformidade — sprites do Bosque

## Resultado

**Parcial. A entrega não atende integralmente ao pedido de arte e combate e não deve ser considerada visualmente concluída.** A revisão encontrou um defeito que impedia o carregamento da dupla na cena e outro que tornava a prévia desalinhada. Ambos foram corrigidos neste commit de auditoria. Typecheck, lint, testes, build e validação das folhas passaram depois das correções.

## Itens verificados

- [x] Repositório estava limpo antes da auditoria; branch `feat/cryptidle-mvp`, commits prévios preservados.
- [x] A cena usa `sequence`, HP do monstro e HP do personagem recebidos do servidor; não concede recompensas em callback de animação.
- [x] Os 11 PNGs existem, são RGBA e têm células de 112×144; os ciclos têm seis quadros e `hurt` tem três. `pnpm validate:assets` passou.
- [x] A prévia `/dev/animations` abriu no Chromium via Playwright em 1366×768 e 1920×1080; seleção de ação, pausa e avanço de quadro responderam. Screenshots estão em `docs/evidence`.
- [x] Velocidade no painel do personagem agora formata duas casas; strings visíveis específicas que tinham `?` foram corrigidas.
- [x] A cena agora carrega uma textura-base para Guerreiro e Morcego, além das folhas por ação. A prévia usa o tamanho real das células e desloca cada quadro pela largura registrada nos metadados.
- [ ] A caça autenticada não foi percorrida por dois minutos; inventário, equipar, parar/retomar, troca de região e aba inativa não foram exercitados no navegador.
- [ ] 1920×1080 e viewport móvel não foram inspecionados. Não há screenshot da cena de caça nesta revisão.

O console da prévia ficou sem erros ou avisos depois de adicionar um favicon. Não apareceram erros de carregamento de folhas na rota de prévia. Essa rota não instancia Phaser, portanto isso não prova a integração completa da cena.

## Desvios restantes

1. **Acabamento artístico abaixo do pedido.** As novas folhas vieram de desenho procedural em Pillow, não de geração de imagem nem de pintura quadro a quadro. A inspeção da prévia mostra figuras geométricas de baixa complexidade, sem a expressividade e o nível de detalhe pedidos como referência. A imagem de referência orientou cores e silhueta, mas não foi usada para derivar um Guerreiro idle sobre o cenário real.
2. **Ciclos incompletos.** `hurt` agora tem três quadros, conforme a meta, mas a reação corporal ainda é fraca. A morte não mostra uma queda clara nem mantém uma pose final convincente. O Morcego reutiliza praticamente a mesma geometria em idle, movimento, ataque, dano e morte; as asas variam pouco entre ações. O ataque de habilidade tem ângulos de espada distintos do ataque básico, mas ainda não tem um efeito separado na cena.
3. **Direções incompletas.** A direção oposta só é espelhada na ferramenta de prévia. Não há folhas desenhadas para a direção de retorno, então espada e escudo trocam de lado no espelho.
4. **Eventos de combate agregados.** O estado servidor fornece sequência e HP, não eventos com ator, alvo, ação e resultado. O cliente deduz que houve ataque quando HP muda. Isso impede afirmar que a animação específica de ataque/habilidade corresponde a um evento individual explícito. Os números flutuantes usam diferenças reais de HP recebidas.
5. **Apresentação da luta incompleta.** Não foi demonstrado um ciclo de aproximação até a distância de golpe; a movimentação atual avança o Guerreiro apenas de x=350 para x=405 enquanto o Morcego fica perto de x=655. A cena também não implementa folhas ocasionais, névoa ou oscilação da lanterna. Sombras estão desenhadas dentro dos sprites e também são criadas como elipses Phaser.
6. **Validador simples.** Ele verifica presença, modo RGBA, dimensões e intervalos de índices definidos no próprio script. Ainda não lê os metadados TypeScript como fonte única nem compara cada ponto de ancoragem com os quadros.

## Próxima correção para concluir

Produzir folhas revisadas do Guerreiro e Morcego com poses realmente distintas e direção correta, sem sombras embutidas; consolidar os metadados em uma fonte consumida pelo renderer e validador; estender o contrato do servidor com eventos de combate identificados se a apresentação exigir animações por golpe; então executar a caça real e inspecionar tamanhos e fluxos restantes no navegador.
