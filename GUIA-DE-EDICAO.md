# Como editar sem quebrar o jogo

Abra **EscapeCode.code-workspace** no VS Code. Salve suas alterações, feche o jogo e abra o mesmo **Escape-Code.exe**. A pasta `dist` deve ficar junto dele. Não é necessário recompilar alterações em JavaScript, HTML, CSS, imagens ou sons.

## Comece por este arquivo

**`dist/configuracao.js`** reúne as mudanças mais comuns, com comentários ao lado:

```js
export const NOMES = {
  cachorro: "Sorvetete", // Nome acima do Pug e nas falas.
  amigo: "Brita", // Personagem do bolo e da Biz.
  protagonista: "Axel",
};
```

Mude apenas o texto **entre aspas**. Preserve as vírgulas, chaves e nomes das propriedades. O mesmo arquivo permite ajustar fôlego, velocidades e quantidade de logos.

## Onde fica cada parte

| Arquivo em `dist` | Conteúdo |
| --- | --- |
| `configuracao.js` | Nomes e ajustes básicos; comece aqui |
| `jogo.js` | Regras, interações, progressão e interface; funções comentadas |
| `desafios.js` | HTML/CSS simples: perguntas, alternativas, respostas e explicações |
| `mapas.js` | Plantas das fases, caminhos e perseguição |
| `coletaveis.js` | Distribuição dos logos GTA VI |
| `index.html` e `estilos.css` | Estrutura e aparência dos menus |
| `modelos.js` e `personagens.js` | Malhas de Axel, Sorvetete, Brita e Maicon |
| `objetos-da-historia.js` | Bolo, sacolas e Biz |
| `cena-do-jogo.js` | Classe `CenaDoJogo`: câmeras, luzes e renderização |
| `cena-do-menu.js` | Composição 3D do menu |
| `sala-de-aula.js` e `calabouco.js` | Cenas da história |
| `fisica-do-corpo.js` | Ragdoll e colisão com o chão |
| `som.js` | Classe `Som`: músicas, efeitos e volumes |
| `assets/` | Imagens, modelos importados e áudios |

As classes e funções do projeto estão em português. As APIs externas, como `renderer.render`, `AudioContext.resume`, `document.getElementById` e os nomes de Three.js, permanecem no idioma original: traduzi-las impediria a execução. Não edite a pasta `vendor`, que contém a biblioteca externa.

## Três cuidados importantes

1. Para alterar nomes, use `configuracao.js`, sem renomear funções ou exportações.
2. Letras maiúsculas e minúsculas fazem diferença. O erro anterior foi a troca de `YURI_DURATION` por `yuri_DURATION`, sem atualizar quem o importava. Essa constante agora se chama `DURACAO_CENA_BRITA` e usa a configuração central.
3. Não troque os valores `data-action` do HTML nem os nomes de arquivos importados sem atualizar suas referências.

Para conferir as regras, execute `npm test` no terminal do VS Code. Node.js 22 ou superior é necessário somente para testes e para a prévia opcional com `npm start`. Para jogar pelo EXE, basta o WebView2 do Windows.

O arquivo `native/Programa.cs` contém as classes `Programa` e `JanelaDoJogo`, responsáveis pelo aplicativo Windows. Só alterações nesse aplicativo exigem recompilar: feche o jogo e execute `powershell -File scripts/build-windows.ps1`. O resultado substitui o mesmo `Escape-Code.exe`.

## Alisanave

Modelos e cenas: dist/alisanave.js. Planta, contagem de dez segundos e três desafios: dist/regras-alisanave.js. Anatomia humana: dist/humanos.js. A força do arremesso de Brita fica em dist/configuracao.js. Detalhes em FASE-ALISANAVE.md.


## Quarto de Axel

Decoração, quadros, pôsteres, bicicleta aro 29 e cena de faroeste da TV ficam em dist/quarto-do-axel.js. A foto está em dist/assets/amigos-quarto.jpg. A carcaça vermelha do PS5 é definida em dist/cena-do-jogo.js. O refrão da coleta GTA VI fica em dist/assets/gta-collect.wav; a origem e o ponto de corte estão em gta-collect-origem.json.


## HUD e minimapa

O desenho do minimapa fixo e a rota pelos corredores ficam em dist/minimapa.js. O mapa revela terminais numerados, saída, coletáveis e ameaças próximas. As placas e luzes azuis dos terminais ficam em dist/cena-do-jogo.js. O estilo compacto do HUD fica no final de dist/estilos.css. O raio de interação dos terminais é de 3 metros.


## Cenas e controle físico

A sala branca é automática; movimento só é liberado após o tobogã. Tempos em dist/regras-alisanave.js; câmeras e voo no colo em dist/alisanave.js. Modelos de Charlie, SQLman e cabeça Yang Ming em dist/modelos-alisanave.js. As malhas anteriores de Fanta e SENAI continuam em uso. Edite a animação de Brita no menu em dist/cena-do-menu.js. A leitura de controles está em dist/controles-gamepad.js e as ações estão em atualizarEntradaControle, dentro de dist/jogo.js. Os efeitos gráficos ficam em dist/efeitos-visuais.js.


O chute ao iniciar a história fica em desenharChuteDoMenu (dist/cena-do-menu.js). O tempo, o som e a passagem ao quarto estão em atualizarJogo (dist/jogo.js), nos campos chuteMenuAtivo e tempoChuteMenu. A duração é de 3,8 segundos.


Castelo: veja FASE-CASTELO.md para localizar personagens, furtividade, perguntas e gráficos. Ctrl (ou círculo/B) alterna agachar.

## Seletor de level para testes — 2.13

No menu, entre em OPÇÕES e procure SELETOR DE LEVEL · TESTES. Escolha um trecho e pressione INICIAR LEVEL SELECIONADO. O mesmo painel está disponível em Esc → OPÇÕES / SELETOR DE LEVEL.

O seletor inclui quarto, os três setores das Backrooms, voo do SQLman, sala branca, tobogã, porto/Yang Ming, barco, chegada ao castelo, salão, escadaria, terraço e três entradas da fase Frutiger Aero. Cada teste começa com pontuação zerada e estado limpo; os atalhos da escadaria e do barco preparam somente os requisitos necessários para iniciar o trecho. A fase Frutiger Aero continua com resgate e futebol livre na arena.

Código do seletor: `dist/jogo.js`, função `iniciarFaseTeste`. Opções visíveis: `dist/index.html`, elemento `faseTeste`. No controle, navegue até o seletor e use D-pad esquerda/direita para trocar a opção; confirme no botão abaixo.

## Fase aquática

Veja FASE-FRUTIGER-AERO.md. O seletor inclui entrada pela cidade, resgate e arena jogável. Os arquivos da nova fase têm nomes em português e ficam em dist, separados entre regras, modelos, cidade, água e câmeras.
