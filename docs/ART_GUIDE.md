# Guia de arte — Cryptidle

## Direção

Fantasia medieval sombria: acolhimento nas lanternas de Cinzabrasa, perigo nas ruínas. Centro da tela reservado ao mundo; painéis laterais em pedra verde escura, ouro envelhecido nos destaques. Interface usa Cinzel para títulos e Inter para texto, com fallback Georgia/system-ui. Fontes Google Fonts sob SIL OFL; a aplicação funciona usando os fallbacks caso o serviço esteja indisponível.

## Produção e procedência

Quatro cenários originais foram criados com a ferramenta embutida `image_gen`; prompts e arquivos em `assets/manifest.json`. Não são capturas de interfaces: cada cenário é um asset independente consumido pelo Phaser. Sprites e ícones são desenhos programáticos originais em Pillow, reproduzíveis com `python assets/generate_sprites.py` (Pillow 12.3). Não são atribuídos à IA. Não há personagens ou assets de PokeIdle.

Arquivos finais ficam em `apps/web/public/art/`, copiados ao build pelo Vite. A licença definitiva do projeto e de seus assets permanece decisão do proprietário; nenhum pacote de assets de terceiros foi incorporado.

## Grades, alinhamento e animação

- Personagens: célula RGBA transparente de **32×48**, sheet **384×48**, 12 frames numa linha; seis sheets (três classes, duas aparências).
- Monstros: mesma grade para nove criaturas e boss. Boss ampliado a 5×, criaturas 3.5×, personagem principal 3×; filtro nearest neighbor, `pixelArt: true`, sem suavização.
- Frames 0–2 idle a 4 fps; 3–5 deslocamento a 4 fps; 6–8 ataque a 9 fps; 9–11 derrota sem loop. Pivô Phaser `(0.5, 0.88)` constante. Corpo conserva base entre poses; respiração desloca intencionalmente um pixel. Sprites não usam recorte automático variável.
- Ícones: **24×24 RGBA**, exibidos a 24 ou 36 pixels; arma, cabeça, peito, acessório, poção, gold, XP e habilidades.
- Cenários: **1536×1024**, cenário lógico Phaser **960×600**, composição com área central livre. Câmera fixa levemente elevada; sem colisões ou navegação livre.
- Paleta sprites: contorno `#141c27`, pele `#d4ac87`, ouro `#ddba75`; guerreiro aço `#718c9b`, mago violeta `#8b77b4`, sacerdote linho `#d6c69a`. Skins alternativas vermelho, turquesa e ouro. Raridades cinza, verde, azul e violeta.

## Efeitos e autoridade

Ataque tem animação de pose, deslocamento e arco luminoso. Dano e cura flutuantes usam a diferença de HP confirmada pelo servidor; cura adiciona círculo verde. Gold/XP e aquisição de itens usam o resumo real retornado pela API. Drop tem estrela violeta e mensagem. A interpolação visual não concede XP ou itens e não calcula dano. Nas telas offline, o resumo modal conserva o retorno até ser fechado.

## Verificação e limitações

Sheets usam grade fixa sem atlas trim, evitando mudanças de pivô. Inspeção dos arquivos town e warrior confirmou cenário independente e transparência da sheet. A inspeção browser e screenshots finais são registradas em `docs/evidence` pelo fluxo de validação. Os cenários têm densidade de pixels mais alta que os atores de 32×48; uma futura passagem manual de pixel art pode uniformizar essa densidade. Animação de ataque comunica atividade contínua; não é um replay exato de cada golpe do servidor, que resolve encontros completos.

## Segunda rodada: cena 2D pixelada

Na cena jogável o Guerreiro e o morcego do Bosque das Cinzas usam folhas RGBA originais de **112×144 por célula**; a maioria das ações tem seis quadros e `hurt` tem três. O filtro nearest-neighbour e o pivô fixo no centro inferior alinham os atores. A largura foi ajustada de 96 para 112 px depois que a inspeção alfa detectou a espada cortada na borda. As folhas ficam separadas por ação (`idle`, `walk`/`move`, `attack`, `skill`, `hurt`, `death`); sombras de contato são objetos Phaser separados. A animação é desenhada em camadas de contorno, aço e tecido.

O Phaser e o canvas usam renderização pixelada; o fundo continua sendo o cenário panorâmico existente, enquanto atores, sombras e efeitos são objetos 2D independentes. A geração reproduzível está em `assets/generate_detailed_sprites.py`; a procedência e os arquivos estão em `assets/manifest.json`. Esta rodada cobre a cena de referência Guerreiro + Bosque das Cinzas; as outras classes e regiões continuam com os sheets anteriores até uma passagem específica.
