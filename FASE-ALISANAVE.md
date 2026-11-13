# Fase 02 — Alisanave

Na história, a fase começa depois da última porta dos três setores das Backrooms. Para conhecer a fase sem repetir o prólogo, use **Menu → Opções → Jogar fase 02 / Alisanave**.

1. Axel cai no limbo escuro; SQLman o segura no colo e voa sobre o mar até a Alisanave. O voo dura 22 segundos e mostra céu, porto e empresa.
2. A sala branca é uma cutscene de 18 segundos: Charlie conversa no computador, a cabeça dele se desprende e Axel segue para o tobogã. Os comandos de movimento ficam bloqueados.
3. Axel entra automaticamente no tobogã. A câmera percorre o interior do tubo 3D por sete segundos. O jogo libera os controles ao desembarcar.
4. Ao desembarcar no labirinto, há **10 segundos** até Yang Ming começar a perseguir. **WASD** move, mouse ou setas olha, **Shift** alterna corrida. Caminhar recupera o fôlego.
5. Ative os **três painéis de HTML/CSS simples** usando E e escolhendo a resposta. Os painéis pausam a perseguição, explicam os conceitos e restauram fôlego. Charlie dá direções pelos corredores.
6. Chegue à beira do mar e use **E** perto da placa do barco. A viagem acontece em 3D e termina no castelo distante.

Yang Ming respeita as paredes. Se alcançar Axel, é possível recomeçar esta fase pela sala branca. O som do link enviado toca quando o monstro se aproxima e fica mais baixo quando se afasta. Uma trilha tensa de pulsos é sintetizada durante a perseguição. As opções de áudio continuam valendo.

## Arquivos para editar

| Arquivo | Responsabilidade |
| --- | --- |
| `dist/regras-alisanave.js` | Planta fixa, cronômetro, movimento, perseguição e três desafios |
| `dist/alisanave.js` | Porto, Charlie, SQLman, Yang Ming, tobogã, barco e castelo em 3D |
| `dist/humanos.js` | Anatomia e articulações dos modelos humanos |
| `dist/sala-de-aula.js` | Impulso mais forte e câmera do arremesso de Brita |
| `dist/assets/yang-ming-som.m4a` | Som enviado para a aproximação do monstro |

As novas malhas são interpretações estilizadas das referências, não digitalizações fotorrealistas. A textura do rosto de Charlie usa um recorte da ficha fornecida. O corpo, a cabeça voadora, os contêineres e as pernas de Yang Ming são geometria 3D. A água usa shaders de ondas, reflexo de céu e Fresnel; a capa de SQLman é animada por vértices. São efeitos visuais, sem simulação completa de fluidos ou tecido.

Axel voltou ao modelo original de garrafa Fanta com chapéu de cowboy. O perseguidor voltou ao logo SENAI com pernas. Brita e o professor também usam seus modelos anteriores. Os novos modelos humanos ficam restritos a Charlie e SQLman. Sorvetete continua Pug, e Yang Ming conserva a anatomia monstruosa solicitada.

## Menu e controles

O menu mostra Brita de capuz comendo bolo; Maicon olha para trás e o arremessa em um ciclo. A opção Movimentos reduzidos deixa a composição estática. As cabeças têm movimentos pequenos de respiração e atenção.

Conecte um controle ao Windows por USB ou Bluetooth e pressione um botão. DualSense, DualShock e controles que a Gamepad API reconheça podem ser usados. Analógico esquerdo move, direito olha, X/A interage, L3 alterna corrida, Quadrado/X ou R2 defende, Triângulo/Y amplia o mapa, L1 abre recuperação e Options pausa. D-pad ou stick navega pelos botões; X/A escolhe ou executa respostas. No volume e na qualidade, use D-pad esquerda/direita. Desconectar pausa o jogo.

Modelos detalhados desta fase: dist/modelos-alisanave.js. Shaders e pós-processamento: dist/efeitos-visuais.js. Leitura de gamepads: dist/controles-gamepad.js. Cena de fundo do menu: dist/cena-do-menu.js.


## Atualização do porto

O porto agora é noturno, com lanterna, patadas fortes e detalhes orgânicos em Yang Ming. A travessia de barco dura 10 segundos e termina na fase jogável do castelo descrita em FASE-CASTELO.md. Ctrl ou círculo/B alterna agachar.
