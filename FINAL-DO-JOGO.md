# Final do jogo — 2.24

O cinema agora continua depois da eleição. A presença escondida revela ser Clayface, que segue Axel desde o Komprão usando disfarces. A sequência tem narração em português, perseguição com colisão, passos posicionados no estéreo, fôlego e checkpoints. A brecha no corredor lateral esquerdo do cinema leva aos corredores infantis da Peppa.

Nos corredores, reative os painéis rosa e verde. Um desafio de JavaScript libera a porta para o Level 94. A paisagem foi reconstruída com colinas verdes, casas claras repetidas, cercas e caixas-d'água, inspirada na imagem fornecida e no [mapa do Workshop de bush boi](https://steamcommunity.com/sharedfiles/filedetails/?id=2818489283). É uma recriação própria em Three.js, não a importação do arquivo do Garry's Mod.

Explore as colinas, leia o bilhete e procure a chave da casa 09. Axel olha para trás e vê Clayface correndo ao longe; o jogador precisa chegar à casa iluminada. Ser alcançado permite tentar novamente a partir do checkpoint.

Na casa há os cinco Simpsons fornecidos pelo usuário, sentados diante da televisão, além de uma aparição breve e estranha do Bart animado durante a interrupção. O jogador explora a sala e sintoniza a TV. O trailer de Fortnite e a vinheta do Plantão são vídeos locais reproduzidos numa textura da televisão 3D. A transmissão é interrompida por uma notícia **explicitamente fictícia**, dentro da paródia do jogo, sobre Davy Jones e o adiamento de GTA 6. A notícia não representa um acontecimento real. Depois vêm o silêncio, a chuva e a saída da casa.

Um portal roxo leva Axel ao calabouço onde estava a Biz. Recupere a chave e a moto. Depois de um exercício simples sobre `tel:`, opere o celular em primeira pessoa: **Telefone → Brita → Ligar**. A ligação é local e simulada; não abre aplicativos externos nem faz chamadas reais. Brita orienta Axel a seguir as três placas azuis. O jogador pilota a Biz pela estrada e a entrega ao amigo. A cena do reencontro encerra a história e abre os créditos.

O novo menu tem composição noturna inspirada na referência de Arkham City: Axel num telhado, lua grande, morcegos, chuva e interface cinza. O início da história e as fases anteriores permanecem disponíveis.

## Teste rápido

Abra **Escape-Code.exe → Opções → Seletor de level**. A opção **Arcoplex · resultado da eleição** continua até o novo final. Para começar diretamente na ação, escolha **Final · revelação do Clayface**. Há atalhos para cada trecho, inclusive telefone e viagem da Biz.

WASD move ou pilota. Mouse olha; clique no cenário para capturar o mouse. Shift corre, Ctrl agacha, F alterna a lanterna e E interage. No celular, clique nos botões; o controle também navega pelos botões. Esc pausa cenas, áudio, perseguição e vídeos. As placas e a interface indicam o próximo objetivo.

## Arquivos e origem dos recursos

- `dist/regras-final.js`: exploração, colisão, perseguição, checkpoints, telefone e conclusão.
- `dist/capitulo-final.js`: Level 94, corredores, Simpsons, TV, portal, mãos e estrada.
- `dist/falas-final.js`: roteiro narrado e cronologia. Voz genérica Microsoft Daniel OneCore pt-BR, gerada localmente, sem clonagem de voz.
- `dist/cena-do-menu.js`: menu noturno, mantendo a entrada anterior da história.
- Família: OBJ e textura extraídos de `the-simpsons-characters.zip`, fornecido pelo usuário. Bart animado: `bart-simpson-shuffling/source/Shuffling.fbx`. Autoria/licença original não informada; os modelos não são atribuídos à equipe como criação própria.
- Música dos corredores/Level 94: [vídeo solicitado](https://www.tiktok.com/@aikodigital/video/7609714243084078357).
- Música do menu: [vídeo solicitado](https://www.tiktok.com/@thegothamnightmare/video/7552656564075744534).
- Trailer da TV: [Fortnite — Season 4 Announce Trailer](https://www.youtube.com/watch?v=fDRrqJU4-Tk), interrompido após 24 segundos nesta sequência.
- Vinheta: [Plantão Globo](https://www.youtube.com/watch?v=7DYomde2YEc). A notícia posterior foi criada para a paródia, não extraída de um telejornal real.
- Referências de paisagem, portal, celular e menu: imagens anexadas pelo usuário. Cenários e interfaces foram construídos por código.

O EXE principal inclui os recursos. O pacote editável inclui um aplicativo menor que lê `dist`, que precisa ficar ao lado dele. O empacotador escreve o ZIP de recursos diretamente no EXE, com rodapé identificado, para reduzir espaço temporário durante a compilação.
