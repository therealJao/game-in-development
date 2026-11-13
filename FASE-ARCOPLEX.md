# Komprão e Arcoplex — versão 2.23

A sequência continua automaticamente depois do jornal do Komprão na lua. Brita continua com o grupo; FNAF permanece fora da história.

No mercado, os modelos fornecidos de LEGO Clayface e LEGO Joker recebem os amigos. O Coringa arremessa um carrinho contra o grupo. O jogador controla Axel em primeira pessoa, coleta as quantidades indicadas e volta ao caixa para entregar cada lista. Produtos extras ou quantidades repetidas não contam. As duas listas usam Arroz Camil, Feijão Kicaldo, Leite Piracanjuba, Guaraná Antarctica, Biscoito Bauducco e Chocolate Lacta; embalagens são representações próprias com nome da marca.

Dois exercícios obrigatórios de programação tratam de `Array.includes` e de um botão HTML. Os exercícios pausam a cena e os áudios, oferecem dicas e não penalizam erros. Eles acontecem no mercado, antes da exploração de terror.

Depois das compras surge uma porta isolada no fundo do mercado. Aproximar-se e pressionar E mostra o hall pelo olho mágico. Após a travessia, Axel está sozinho no andar do cinema. O hall tem painéis de madeira, bombonière, bilheteria, filas metálicas, piso quadriculado, escada e corredor de salas. Os quatro cartazes fornecidos estão nos expositores do corredor. A reconstrução é estilizada, baseada nas referências; não é um levantamento arquitetônico do shopping.

Os passos começam a subir a escada. Há perseguição com obstáculos, fôlego limitado, possibilidade de correr e reinício no hall caso Axel seja alcançado. A saída da perseguição fica na SALA 3, no corredor da direita. Dentro da sala há fileiras em níveis, poltronas com braços e bandejas, luzes discretas, tela iluminando o ambiente e uma presença escondida entre os assentos. A identidade e a continuação ficam em aberto.

A tela projeta um cenário 3D do Jornal Nacional com os modelos existentes de Alya e Lula. O debate e a apuração são explicitamente ficcionais. As falas usam vozes sintéticas genéricas do Windows. Depois aparece a imagem enviada com Alya 89,74% e Lula 10,26%. A nova história termina nesse resultado.

## Testar rapidamente

Abra Escape-Code.exe, entre em **Opções → Seletor de level** e escolha **Komprão · Clayface e Coringa**. Também há atalhos para compras, porta, olho mágico, shopping, fuga, sessão e resultado.

- WASD: mover. Mouse: olhar; clique no cenário para capturar o mouse.
- E ou botão principal do controle: pegar produtos, entregar compras e interagir com portas.
- Shift: correr. Ctrl: agachar. F ou X/Quadrado: lanterna.
- Esc: pausar. O tempo, a perseguição e os áudios param juntos.

Em caso de falha de compilação gráfica, o aplicativo tenta reiniciar uma vez com renderização de software. Essa alternativa pode ter desempenho menor. O modo padrão continua usando o renderizador disponível do computador.

## Recursos e referências

- Modelos: lego-clayface/source/Clayface.zip e lego-joker/source/LegoJoker.rar fornecidos pelo usuário; malhas/texturas preservadas e adaptadas para Three.js. Autoria/licença original não informada nos arquivos recebidos.
- Fotos do interior do Komprão, hall, sala, cartazes e apuração: anexos do usuário. A sala 3D segue a referência de poltronas marrons, bandejas e corredores em níveis.
- Trilha solicitada: [TikTok @notabandonedbytra](https://www.tiktok.com/@notabandonedbytra/video/7649029310073834759), incluída em assets/arcoplex/ambiente.m4a.
- Pesquisa: [Arcoplex no Itajaí Shopping](https://itajaishopping.com.br/loja/arcoplex-cinemas/), [cinema do shopping](https://itajaishopping.com.br/cinema/) e [programação oficial Arcoplex](https://arcoplex.com.br/itajai-shopping/programacao).
- Referências fotográficas do hall e salas: [Transe Tudo — hall](https://transetudo.com.br/publieditorial/filme-silvio-chega-as-telonas-do-arcoplex-nesta-quinta-feira), [Transe Tudo — sala](https://transetudo.com.br/publieditorial/arcoplex-itajai-tem-sabado-com-meia-entrada-e-sessao-inclusiva-no-domingo).

## Edição

`dist/regras-arcoplex.js`: listas, colisão, perseguição, transições e movimento. `dist/arcoplex.js`: cenários, modelos e projeção. `dist/falas-arcoplex.js`: falas, tempos e áudio. `dist/desafios-novas-fases.js`: exercícios. Recursos em `dist/assets/arcoplex/`.

O EXE principal contém o jogo. A pasta editável e o ZIP usam um EXE menor que lê a pasta `dist` incluída; mantenha esses arquivos juntos.
