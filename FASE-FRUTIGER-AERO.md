# Fase 04 — Frutiger Aero / AeroShore — 2.14

## Conteúdo

A queda após a explosão do castelo agora continua numa cidade aquática. Naverdachi resgata Axel, conversa usando a gravação enviada e o leva nadando até a Neo Química Arena aquática. A chegada mostra o estádio antes de liberar o futebol.

A cidade é uma recriação própria em geometria 3D baseada nas capturas públicas do Gm_AeroShore: fachadas brancas com vidro verde, torre azul curva, átrio arborizado, passarelas, quiosque e ponto de ônibus com banco verde. O cenário foi adaptado para ficar submerso, com peixes, bolhas, vegetação e efeitos de luz na água. Não é o arquivo original do Workshop nem uma reprodução integral de seus interiores e sistemas.

A arena tem campo demarcado, gols com redes, arquibancadas com assentos instanciados, cobertura com estrutura e vidro, aquários laterais e uma cúpula translúcida. O modelo foi construído por código a partir das referências, não corresponde ao modelo comercial da Hum3D mostrado nas imagens.

A água usa ondas nos vértices, normais animadas, Fresnel, transparência e reflexo planar nos perfis Alta/Ultra quando vista por cima. Há cáusticas animadas, raios de luz, partículas e peixes nadando. Os materiais e personagens continuam estilizados; não são digitalizações fotorrealistas.

## Jogar

- WASD ou analógico esquerdo: mover Axel.
- Mouse, setas ou analógico direito: olhar e mirar.
- E, Espaço ou ✕/A: chutar quando perto da bola Bluezão.
- Shift ou L3: alternar corrida.
- Esc ou Options: pausar.

Naverdachi joga contra Axel, buscando o gol oposto. A bola recebe gravidade, quica no chão e rebate nas laterais. Gol conta uma vez e reposiciona bola e jogadores depois de uma pausa curta. Na versão 2.15, o primeiro a marcar cinco gols encerra a partida e inicia a transformação de Bluezão. A batalha e a comemoração estão descritas em BATALHA-BLUEZAO.md.

## Acesso para testes

Opções → Seletor de level → Fase 04 · Cidade / Resgate / Neo Química Arena. Os atalhos iniciam estados limpos. Também é possível iniciar pelo terminal:

```powershell
.\Escape-Code.exe --test-level aero-arena
```

Use `aero` para a queda ou `aero-resgate` para a conversa. A história normal segue pelo portal e pela cutscene do castelo.

## Editar

| Arquivo | Responsabilidade |
| --- | --- |
| `dist/frutiger-aero.js` | Cenas, percurso, animações e câmeras |
| `dist/cidade-aeroshore.js` | Arquitetura da recriação costeira |
| `dist/modelos-frutiger-aero.js` | Arena, Naverdachi e bola Bluezão |
| `dist/agua-frutiger-aero.js` | Ondas, reflexo planar e cáusticas |
| `dist/regras-frutiger-aero.js` | Tempos, movimento, física da bola, gols e adversário |
| `dist/jogo.js` | Integração, trilha, fala, placar e atalhos |
| `dist/assets/naverdachi-fala.m4a` | Fala original, aproximadamente 29,8 segundos |
| `dist/assets/aero-ambience.m4a` | Trilha original, 60 segundos, repetida durante a fase |

A trilha acompanha o volume de música e diminui durante a fala. Pausar congela a simulação e interrompe os áudios; continuar retoma o trecho. Salve o código em dist, feche e reabra o mesmo executável para aplicar alterações.


## Programação e restaurante — 2.18

Sete terminais acompanham a fase: iluminação CSS na cidade; inicialização do placar; incremento após dois gols; E lógico antes da batalha; laço após a vitória; formulário do pedido no restaurante; fila de pedidos no balcão. Cada exercício pausa a cena e o áudio, oferece dica, explica a resposta e pontua uma vez.

O último terminal exige caminhar até o balcão. Ele usa shift() para retirar o primeiro pedido da fila. Quando resolvido, a refeição é servida. Os dois terminais ligados à antiga viagem de carro foram retirados junto daquela continuação.

O restaurante agora segue a nova fotografia e a área desenhada da planta: entrada frontal, mesas quadradas à esquerda, banheiro à esquerda, duas mesas redondas à direita, geladeira à frente do balcão e cozinha ao fundo à direita. O desenho à direita da folha é interpretado como legenda de cadeiras e mesas. Letreiros e mascotes usam recortes UV da foto, mantendo seus dizeres.

Os modelos de Lula e Bolsonaro foram importados dos novos arquivos fornecidos. Bolsonaro utiliza seu esqueleto; Lula recebe uma articulação local com pesos preservando geometria e UVs. O áudio SaveClip é reproduzido inteiro na revelação da cozinha. As perguntas novas da dupla usam voz sintética genérica em português, sem imitar as vozes reais.

A fase termina com os dois no Ponto Kente. A continuação com Toguro e a pizzaria está removida do fluxo atual.

Atalhos: aero-lanchonete (cutscene); aero-cozinha (exploração); aero-refeicao (refeição); aero-programacao (terminal da arena). O modo de teste do executável também aceita --capture-test CAMINHO.png e --test-time SEGUNDOS para capturar um quadro de verificação de uma cena própria do jogo.


## Continuação 2.19 — AlisaBank e Peugeot

Durante a refeição soa uma buzina. A dupla precisa pagar R$ 67,00 antes de sair. Lula e Bolsonaro estão calmos no caixa; Lula entrega o cartão de QR code ao Naverdachi. O jogador assume o celular de Naverdachi: abrir AlisaBank → Pix → Escanear QR code → confirmar R$ 67,00 → mostrar comprovante.

A moldura utiliza o PNG enviado. A interface roxa é própria do AlisaBank, com o titular Naverdachi da Silva Pereira. O QR é realmente decodificado do render da câmera 3D por jsQR. A câmera é virtual e não solicita acesso à webcam. O saldo fictício começa em R$ 1.356,98 e fica em R$ 1.289,98 após um único débito de R$ 67,00. Não há conta, chave Pix ou transferência real. O recibo é cenográfico.

A saída fica bloqueada até pagar e mostrar o comprovante. Lula agradece com somente os 2,66 segundos iniciais do áudio indicado. A dupla sai pela entrada da lanchonete e embarca no Peugeot 307 ano 2008 fornecido. Bruno Henrique dirige, com a fotografia indicada no rosto e o áudio enviado durante a viagem costeira. Esta parte termina a caminho da praia; a partida de futebol na areia fica para a continuação.

Atalhos novos: aero-pix (celular desde a tela inicial), aero-pix-conta (conta de Naverdachi), aero-pix-camera (teste da leitura do cartão) e aero-peugeot (viagem). aero-agradecimento é um atalho interno de verificação do comprovante sendo mostrado.

Regras e validação: dist/regras-alisabank.js. Interface: dist/alisabank-ui.js. Leitura da câmera: dist/camera-pix.js. Modelo do carro: dist/peugeot-307.js e dist/assets/peugeot/modelo.json/bin. Estrada: dist/estrada-praia.js. Os desafios de programação anteriores são preservados.
