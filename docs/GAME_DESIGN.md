# Cryptidle — design do MVP

Fantasia medieval sombria para pequenos grupos privados. A cidade segura é Cinzabrasa; caça automática nas regiões Bosque das Cinzas (nível 1), Pântano dos Sussurros (5), Cripta do Eclipse (10). O Guardião do Eclipse é uma expedição separada de 2–4 jogadores, disponível no nível 3. Não há world boss, dinheiro real ou PvP.

## Conteúdo e progressão

Fonte editável: `packages/game-core/src/index.ts`. Três classes, três habilidades por classe (até duas ativas), nove monstros, 24 equipamentos em quatro raridades e quatro slots. Equipamentos são universais; a classe determina atributos base e habilidades. Aparência é independente: 50 vitórias desbloqueiam a segunda skin.

- Guerreiro: HP/defesa elevados; cutilada, proteção ou velocidade. Protege o grupo no boss.
- Mago: ataque/velocidade elevados; chama, barreira ou celeridade. Dano elevado no boss.
- Sacerdote: dano sagrado, cura e proteção. Cura o grupo no boss.

XP acumulada necessária para nível N: `75 × (N−1)²`, nível máximo 20. XP continua acumulando para ranking após o limite. Monstros mais fortes concedem mais XP/gold. Primeira vitória garante equipamento; demais vitórias têm 22% de chance. Raridade condicional ao drop: 60% comum, 28% incomum, 10% raro, 2% épico. Cada drop persistido recebe UUID próprio. Inventário limitado a 200 drops; excesso vira valor de venda NPC, informado no gold do resumo.

## Modelo de combate e offline

Não há simulação de cada golpe físico. Cada encontro calcula o dano agregado com atributos e habilidades do início do encontro, duração (mínimo 18s), HP final, consumo de poção, vitória e loot. O cliente anima ataques entre atualizações, sem autoridade econômica. Ataque, defesa e velocidade afetam DPS; HP, proteção e cura determinam sobrevivência. Há recuperação natural de 12% do HP por encontro. Uma poção, quando a previsão de HP cai abaixo da política configurada, cura 55% do HP máximo. Só é reservada se houver estoque; é consumida ao encerrar o encontro. Não é gerada implicitamente.

Encontros em andamento persistem a duração restante e o resultado calculado. Liquidação processa encontros completos e guarda a fração restante. O mesmo algoritmo serve online e offline: não há multiplicador offline arbitrário. No limite padrão de 8h, são no máximo 1600 encontros, sem 28800 ticks de segundo. O custo depende do teto offline, não de quantos dias a conta ficou ausente. Período além do teto é descartado ao atualizar `lastSettledAt` com o horário atual do servidor. Relógio retrocedido não concede nem desfaz progresso. `OFFLINE_CAP_HOURS` permite reduzir o teto até 8h.

O sorteio usa PRNG determinístico interno persistido, inicializado com bytes aleatórios criptográficos do servidor na criação do personagem. A seed não é exposta ao navegador. A PRNG serve para reprodução interna de simulação, não como substituto de segurança criptográfica. Clientes não recebem endpoints para definir seed, horário ou resultado. O resumo inclui XP, gold líquido, itens, encontros, derrotas e poções. Consultas concorrentes são serializadas por transação no servidor. Reabrir/duas abas não repetem o intervalo já liquidado.

Alterações de equipamento, habilidades e região liquidam primeiro todos os encontros completos anteriores. O encontro parcial é abandonado sem recompensa ou consumo de poção e a nova configuração inicia um novo encontro. Isso evita atribuir atributos novos ao tempo já decorrido. Parar a caça também abandona o encontro parcial. Compra de poções afeta os próximos encontros: um encontro já calculado mantém seu snapshot.

Derrota perde até 3 gold, não perde XP/equipamento, acrescenta 30s de recuperação e restaura 75% do HP. A caça continua. Jogadores podem voltar ao bosque para recuperar progressão.

## Economia

Fontes: 60 gold iniciais; vitórias de caça; venda NPC; recompensas de expedição. Destinos: poções a 8 gold/unidade; até 3 gold por derrota. Mercado transfere gold entre contas, sem criá-lo. Preço fixo inteiro de 1 a 1 milhão; sem compra própria. Não há taxa no MVP. Skins são conquistas gratuitas. Economia de teste é inflacionária; não adequada a competição pública sem balanceamento adicional.

## Boss

Sala por código, líder, 2–4 jogadores, preparo equilibrado/ofensivo/defensivo e confirmação individual. Entrada interrompe caça após liquidação. Ao iniciar, o servidor salva snapshots dos participantes, resultado, log e horário final. Duração padrão 60s. Ao consultar após o horário final, qualquer processo conclui a expedição e concede recompensas em transação com recibo único `(sala, personagem)`. Desconexão/reinício não alteram o resultado. Cooldown padrão 15min configurável. Composição não é obrigatória: equipamentos/nível compensam ausência de cura/proteção. Preparação ofensiva aumenta dano, defensiva aumenta sobrevivência.

## Simulação reproduzível

`pnpm simulate` gera `docs/evidence/balance.json`. Seed fixa por classe, 120min, liquidação por minuto, troca automática por equipamento de melhor score, compra de poções com gold ganho, acesso às regiões ao desbloquear. Resultados locais registrados: primeira melhoria no minuto 1, segunda região no minuto 20, elegibilidade do boss no minuto 6; todas as classes atingiram 20 em 120min. São resultados de simulação, não testes com jogadores. A primeira melhoria está mais rápida que a meta aproximada de 5min por escolha de onboarding. Curva após região 2 é rápida e requer observação com amigos.
