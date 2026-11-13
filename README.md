# Escape Code — projeto editável

Abra **Escape-Code.exe**. Para editar, abra **EscapeCode.code-workspace** e leia **GUIA-DE-EDICAO.md**.

Os nomes são configurados em **dist/configuracao.js**: cachorro **Sorvetete**, amigo **Brita** e protagonista **Axel**. O jogo lê o código da pasta dist junto do EXE. Salve, feche o jogo e abra o mesmo executável para ver suas mudanças.

O projeto foi reorganizado em módulos com nomes em português e código formatado. As classes principais são **CenaDoJogo**, **Som**, **Programa** e **JanelaDoJogo**. Nomes das APIs de Three.js, do navegador e do Windows continuam intactos.

A história, as cenas 3D, a recuperação por HTML/CSS e os coletáveis continuam incluídos. Cada fase tem dois desafios obrigatórios e uma recuperação opcional. A música de coleta dura dois segundos com fade-out.

## Conferir e executar

- Jogo: Escape-Code.exe, sem Node.js. Requer o WebView2 do Windows.
- Testes: npm test, com Node.js 22 ou superior.
- Prévia opcional: npm start e http://127.0.0.1:4176.
- Recompilar apenas o aplicativo nativo: powershell -File scripts/build-windows.ps1.

Os modelos continuam estilizados. Créditos e origem dos recursos estão em CREDITOS.md. A equipe ainda precisa registrar as contribuições escolares efetivamente realizadas; não foram inventadas contribuições dos alunos.

## Fase 02: Alisanave

Integrada após a última saída das Backrooms. Acesso direto: Menu > Opções > Jogar fase 02 / Alisanave. SQLman, Charlie e sua cabeça voadora, tobogã, três painéis de HTML/CSS, perseguição Yang Ming após dez segundos e barco rumo ao castelo. Leia FASE-ALISANAVE.md. Modelos anteriores de Axel (Fanta), SENAI, Brita e professor restaurados; arremesso mais forte de Brita mantido. Agora são 39 testes.


## Quarto atualizado

Quadro e pôster com a foto fornecida, bicicleta aro 29, cama, prateleiras, planta e iluminação colorida. PS5 vermelho e preto. TV com minigame de faroeste identificado como Red Dead Redemption 2, sem incorporar o jogo original. Coleta GTA VI usa a entrada do refrão da música Hot Together. Os arquivos editáveis e o único Escape-Code.exe continuam juntos.


## HUD e orientação

HUD compacto com controles, procurado e minimapa fixo. A planta completa mostra terminais numerados, saída, coletáveis e rota azul pelos corredores. Os terminais têm placas e luzes azuis; é possível interagir a até três metros. M amplia o mapa.


## Cutscenes e gamepad

SQLman carrega Axel no colo em um voo sobre o mar. Sala branca e tobogã são automáticos, com jogo liberado no labirinto. Charlie e Yang Ming têm novas malhas e detalhes. O menu inclui Brita de capuz comendo bolo e o arremesso por Maicon. Shaders de céu/água e pós-processamento estão ativos. Suporte a controles padrão do Windows, incluindo DualSense e DualShock quando reconhecidos pela Gamepad API. Testes automatizados de entradas passaram; validação com hardware físico ainda é necessária.


Ao clicar em Iniciar História, Maicon dá um chute cômico em Brita; ele e o bolo saem voando. A sequência dura 3,8 segundos e então abre o quarto de Axel. Cliques repetidos são ignorados durante a transição.


## Atualização 2.11

Nova fase do castelo após o barco, com furtividade, Ctrl/○/B para agachar, encontros na escadaria e o modelo FBX de CJ fornecido. Veja FASE-CASTELO.md. O barco leva 10 segundos; os escudos Corinthians e Vasco aparecem esticados no céu. Yang Ming agora é perseguido em ambiente noturno, com partes orgânicas, patadas e lanterna. Os terminais continuam marcados e usam HTML/CSS básico.

O perfil Ultra adiciona renderização HDR, oclusão de contato, bloom e materiais com iluminação de ambiente. Pode ser reduzido em Opções conforme o computador. O carregamento do castelo ocorre quando necessário.

## Atualização 2.12

A escadaria foi refeita com patamares separados e colisão sincronizada aos degraus. Os dois exercícios do castelo agora tratam de links HTML e seleção de classes CSS, com objetivos e explicações detalhados. A briga do salão inclui socos e arremessos alternados.

A viagem mostra uma fortaleza na colina e céu dourado. O portal agora inicia a cutscene do terraço com Gabriel Breier e o áudio fornecido; as bolas superaquecem, o castelo explode e Axel cai no mar. O conteúdo novo termina numa prévia Frutiger Aero, sem desenvolver uma fase subaquática jogável. Consulte FASE-CASTELO.md.

## Atualização 2.14 — fase Frutiger Aero

A prévia agora continua no resgate por Naverdachi, viagem pela cidade aquática e futebol na Neo Química Arena. Os áudios dos dois TikToks foram incluídos. A cidade é uma recriação própria baseada nas capturas públicas do Gm_AeroShore; não contém o arquivo original do Workshop. Consulte FASE-FRUTIGER-AERO.md para controles, fontes e detalhes de edição. O seletor oferece os atalhos Cidade, Resgate e Arena.

## Atualização 2.15

Placar Nav/Axe, partida até cinco gols, transformação de Bluezão usando o FBX Hulkbuster fornecido, batalha de ritmo em cinco trilhas e comemoração no Ponto Kente. Os dois áudios solicitados estão incluídos. Consulte BATALHA-BLUEZAO.md para controles e arquivos de edição.


## Atualização 2.18 — Ponto Kente e cozinha

Fachada e planta novas, espera do pedido, perguntas da dupla, briga na cozinha com os modelos FBX fornecidos e áudio SaveClip, meme recortado do Brita ao fundo e exploração do salão com desafio no balcão. A história agora continua e termina no restaurante; o trecho de Toguro em diante foi retirado. Teste pelo seletor em Ponto Kente ou Salão e pedidos. Detalhes em BATALHA-BLUEZAO.md.


## Atualização 2.19 — AlisaBank e carona para a praia

Pagamento fictício de R$ 67,00 feito pelo jogador no celular PNG de Naverdachi, QR code lido da cena 3D, comprovante mostrado ao Lula e saída no Peugeot 307 original com Bruno Henrique. Abra pelo seletor AlisaBank ou Peugeot para testar diretamente. O jogo não faz transferências bancárias nem usa a webcam.

## Atualização 2.22 — Lua dos mercados

O FNAF foi retirado. Depois do vôlei, Brita leva Axel e os amigos nas costas até a lua do Preceiro. A sequência inclui as lojas, os jornais originais vistos em primeira pessoa, a chegada do planeta Komprão e as reações com os áudios enviados. Veja FASE-LUA.md. As novas cenas também estão no seletor de fases.


## Atualização 2.23 — Compras e Arcoplex

Komprão explorável com Clayface e Coringa LEGO, duas listas de compras e dois exercícios de programação. Uma porta com olho mágico leva ao shopping vazio: exploração em primeira pessoa, passos na escada, fuga até a sala 3 e projeção de um debate fictício entre Alya e Lula, terminando no resultado enviado. Os cartazes, a trilha e os modelos anexados estão integrados. Atalhos em Opções → Seletor de level. Consulte FASE-ARCOPLEX.md. O EXE principal contém os recursos; o pacote editável usa um EXE menor que lê a pasta dist incluída.


## Atualização 2.24 — O caminho de volta

A eleição agora continua até o final: revelação e perseguição do Clayface, Backrooms da Peppa, exploração e fuga no Level 94, casa dos Simpsons com TV de verdade, Plantão fictício, chuva, portal, recuperação da Biz, ligação jogável para Brita, pilotagem e entrega. Narração em português e dois exercícios novos. O menu ganhou telhado, lua, morcegos e chuva com a trilha solicitada. Consulte FINAL-DO-JOGO.md. Foram aprovados 116 testes, incluindo o percurso até a entrega e a pausa das novas etapas.
