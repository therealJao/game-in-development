// Checkpoints de programação das fases recentes. Validação por escolha, sem eval.
export const DESAFIOS_NOVAS_FASES = [
  {
    id: "cidade-agua",
    etapa: "viagem",
    tempo: 5,
    tema: "CIDADE AQUÁTICA · CSS",
    titulo: "Reative a iluminação da passarela",
    objetivo:
      'A passarela tem class="passarela". Escolha o CSS que colore somente o fundo dela de azul, mantendo o texto branco.',
    codigo:
      '<div class="passarela">Caminho para a arena</div>\n/* Complete a regra CSS: */\n___',
    opcoes: [
      ".passarela { color: blue; background-color: white; }",
      ".passarela { background-color: blue; color: white; }",
      "#passarela { background-color: blue; color: white; }",
    ],
    correta: 1,
    dica: "O ponto seleciona uma classe. background-color controla o fundo; color controla as letras.",
    explicacao:
      '.passarela corresponde a class="passarela". O fundo fica azul e as letras ficam brancas. A passarela está liberada para a arena.',
  },
  {
    id: "arena-placar",
    etapa: "entrada",
    tempo: 4,
    tema: "NEO QUÍMICA ARENA · JAVASCRIPT",
    titulo: "Ligue o placar antes da partida",
    objetivo:
      "Axel ainda não marcou nenhum gol. Declare uma variável numérica que possa ser atualizada durante a partida.",
    codigo: "___\n// Depois de um gol:\ngolsAxel = golsAxel + 1;",
    opcoes: [
      "const golsAxel = 0;",
      'let golsAxel = "zero";',
      "let golsAxel = 0;",
    ],
    correta: 2,
    dica: "let permite atribuir outro valor depois. Use o número 0, sem aspas, para fazer contas.",
    explicacao:
      'let cria uma variável que pode mudar. 0 é um número; "zero" é texto. O placar está pronto: cada gol acrescenta uma unidade.',
  },
  {
    id: "arena-gol",
    etapa: "futebol",
    gols: 2,
    tema: "INTERVALO DA PARTIDA · JAVASCRIPT",
    titulo: "Atualize o marcador de gols",
    objetivo:
      "O contador começa em 2. Qual instrução soma exatamente um gol e guarda o novo valor, 3, na variável?",
    codigo: "let gols = 2;\n___\nconsole.log(gols); // precisa mostrar 3",
    opcoes: ["gols = gols + 1;", "gols === 3;", "gols = 1;"],
    correta: 0,
    dica: "= atribui um valor. === apenas compara; não muda a variável.",
    explicacao:
      "gols = gols + 1 lê o valor atual, soma 1 e grava o resultado. A expressão de comparação não atualiza nada. O intervalo acabou; a partida continua do mesmo ponto.",
  },
  {
    id: "bluezao-escudo",
    etapa: "transformacao",
    tempo: 6,
    tema: "BLUEZÃO HULKBUSTER · JAVASCRIPT",
    titulo: "Ative a proteção da dupla",
    objetivo:
      "Axel e Naverdachi precisam estar prontos ao mesmo tempo. Complete a condição usando E lógico.",
    codigo:
      "const axelPronto = true;\nconst navPronto = true;\nif (___) {\n  ativarProtecao();\n}",
    opcoes: [
      "axelPronto || navPronto",
      "axelPronto && navPronto",
      "!axelPronto",
    ],
    correta: 1,
    dica: "&& exige as duas condições verdadeiras. || exige pelo menos uma. ! inverte o valor.",
    explicacao:
      "&& é o E lógico: a proteção só é ativada quando os dois estiverem prontos. Agora vem a batalha de ritmo no modo fácil.",
  },
  {
    id: "bluezao-vitoria",
    etapa: "vitoria",
    tempo: 3,
    tema: "VITÓRIA DA DUPLA · JAVASCRIPT",
    titulo: "Envie o sinal de vitória",
    objetivo:
      "Faça o sinal piscar exatamente três vezes. Qual condição encerra o laço depois dos valores 0, 1 e 2?",
    codigo: "for (let i = 0; ___; i++) {\n  piscarSinal();\n}",
    opcoes: ["i > 3", "i <= 3", "i < 3"],
    correta: 2,
    dica: "A contagem começa em zero. Menor que 3 aceita 0, 1 e 2; menor ou igual a 3 também aceita o 3.",
    explicacao:
      "i < 3 produz três repetições: i vale 0, depois 1 e depois 2. Quando chega a 3, o laço termina. Sinal enviado: hora do lanche!",
  },
  {
    id: "ponto-kente-pedido",
    etapa: "lanchonete",
    tempo: 9,
    tema: "PONTO KENTE · HTML",
    titulo: "Confirme o pedido da mesa",
    objetivo:
      "O painel de pedidos precisa de um botão que envie o formulário ao ser pressionado. Escolha o elemento correto.",
    codigo:
      '<form>\n  <label>Lanche <input name="lanche" value="X-salada"></label>\n  ___\n</form>',
    opcoes: [
      '<button type="submit">Confirmar pedido</button>',
      '<a href="#pedido">Confirmar pedido</a>',
      '<img src="pedido.png" alt="Confirmar pedido">',
    ],
    correta: 0,
    dica: 'Um botão com type="submit" envia o formulário. Links navegam e imagens exibem uma figura.',
    explicacao:
      'button type="submit" é o controle próprio para enviar o formulário. O pedido foi confirmado. Agora é só aguardar a cozinha preparar os lanches.',
  },
  {
    id: "cozinha-fila",
    etapa: "lanchoneteExplorar",
    tempo: 0,
    precisaPedido: true,
    tema: "PONTO KENTE · JAVASCRIPT",
    titulo: "Organize a fila da cozinha",
    objetivo:
      "Lula e Bolsonaro estão discutindo e esqueceram os pedidos. O primeiro pedido da fila é o de Axel. Qual método retira e devolve o primeiro elemento da lista?",
    codigo:
      'const pedidos = ["Axel", "Naverdachi"];\nconst proximoPedido = ___;\n// proximoPedido deve ser "Axel"',
    opcoes: ["pedidos.pop()", "pedidos.shift()", "pedidos.length"],
    correta: 1,
    dica: "shift() remove e devolve o primeiro item. pop() retira o último; length conta os itens.",
    explicacao:
      "pedidos.shift() retira Axel do início da fila e deixa Naverdachi como próximo. O painel envia os pedidos na ordem certa: agora os lanches podem ser preparados.",
  },
  {
    id: "praia-placar",
    etapa: "praiaChegada",
    tempo: 5,
    tema: "PRAIA DO PONTAL · JAVASCRIPT",
    titulo: "Prepare o placar do vôlei",
    objetivo:
      "A partida termina quando uma dupla chega a 5 pontos. Qual condição identifica a vitória de Axel e Naverdachi?",
    codigo: "const pontosDaDupla = 5;\nif (___) {\n  comemorar();\n}",
    opcoes: ["pontosDaDupla >= 5", "pontosDaDupla < 5", "pontosDaDupla = 0"],
    correta: 0,
    dica: ">= significa maior ou igual. = atribui um novo valor.",
    explicacao:
      "pontosDaDupla >= 5 compara a pontuação com a meta. Vale para 5 ou mais pontos; o placar real da partida usará essa condição. Pronto: E, Espaço ou A para sacar e rebater, A/D para andar e W para saltar. Nav ajuda nas recepções!",
  },
  {
    id: "lua-placa",
    etapa: "luaChegada",
    tempo: 6,
    tema: "LUA DO PRECEIRO · HTML",
    titulo: "Ligue a placa de ofertas",
    objetivo:
      "O vendedor quer mostrar o jornal na placa da loja. Qual código exibe a imagem e descreve seu conteúdo para quem usa leitor de tela?",
    codigo: "<!-- Exiba a imagem ofertas.png: -->\n___",
    opcoes: [
      '<img src="ofertas.png" alt="Jornal de ofertas do Preceiro">',
      '<a href="ofertas.png">Jornal</a>',
      '<img href="ofertas.png" text="Jornal">',
    ],
    correta: 0,
    dica: "img exibe imagens. src aponta para o arquivo e alt descreve a imagem.",
    explicacao:
      "A tag img carrega ofertas.png pelo atributo src. O texto alt identifica o jornal quando a imagem não pode ser vista. A placa está ligada e o vendedor pode entregar os jornais.",
  },
  {
    id: "lua-precos",
    etapa: "kompraoLeitura",
    tempo: 7.6,
    tema: "LUA DO KOMPRÃO · JAVASCRIPT",
    titulo: "Confira a comparação dos preços",
    objetivo:
      "Axel quer conferir dois preços fictícios no comparador: antes custava 12 e agora custa 9. Qual condição confirma que o novo preço é menor?",
    codigo:
      "const precoAntigo = 12;\nconst precoNovo = 9;\nif (___) { mostrarEconomia(); }",
    opcoes: [
      "precoNovo = precoAntigo",
      "precoNovo > precoAntigo",
      "precoNovo < precoAntigo",
    ],
    correta: 2,
    dica: "O sinal < compara se o valor da esquerda é menor. Um único = altera o valor.",
    explicacao:
      "9 < 12 é verdadeiro. A comparação não muda os preços e confirma a economia de 3 nesse exemplo. O jornal mostrado continua sendo a imagem que você enviou.",
  },
  {
    id: "mercado-lista",
    etapa: "mercadoEntrada",
    tempo: 12,
    tema: "KOMPRÃO · JAVASCRIPT",
    titulo: "Confira o produto na lista",
    objetivo:
      "O carrinho só aceita produtos pedidos. Qual expressão verifica se arroz está na lista?",
    codigo:
      'const lista = ["arroz", "feijao", "leite"];\nif (___) { colocarNoCarrinho(); }',
    opcoes: [
      'lista.includes("arroz")',
      'lista.pop("arroz")',
      'lista = "arroz"',
    ],
    correta: 0,
    dica: "includes procura um elemento e devolve true ou false.",
    explicacao:
      'lista.includes("arroz") devolve true porque arroz está no pedido. Agora procure os produtos e respeite as quantidades.',
  },
  {
    id: "mercado-porta",
    etapa: "portaEstranha",
    tempo: 0,
    tema: "PORTA ESTRANHA · HTML",
    titulo: "Ative o controle da porta",
    objetivo:
      "O controle precisa ser um botão acessível pelo teclado. Qual elemento usar?",
    codigo: "<!-- Controle para examinar a porta: -->\n___",
    opcoes: [
      "<span>Examinar</span>",
      '<button type="button">Examinar</button>',
      '<img src="porta.png">',
    ],
    correta: 1,
    dica: "button já recebe foco e pode ser acionado com Enter ou Espaço.",
    explicacao:
      "O botão tem interação de teclado nativa. O controle está ligado: aproxime-se da porta e pressione E para olhar pelo olho mágico.",
  },
  {
    id: "final-porta",
    etapa: "peppaExplorar",
    tempo: 0,
    precisaPaineis: true,
    tema: "PORTA DO LEVEL 94 · JAVASCRIPT",
    titulo: "Libere a porta",
    objetivo:
      "A porta só abre com os dois painéis ligados. Escolha a condição.",
    codigo:
      "const rosa = true;\nconst verde = true;\nif (___) { abrirPorta(); }",
    opcoes: ["rosa || verde", "rosa && verde", "!rosa"],
    correta: 1,
    dica: "&& exige as duas condições verdadeiras.",
    explicacao:
      "rosa && verde só é verdadeiro quando ambos estão ligados. Agora vá à porta ao fundo e pressione E.",
  },
  {
    id: "final-ligacao",
    etapa: "telefoneBiz",
    tempo: 0,
    tema: "CELULAR DO AXEL · HTML",
    titulo: "Ligue o botão de chamada",
    objetivo: "Qual link pode iniciar uma chamada telefônica ao ser ativado?",
    codigo: "<!-- Número fictício do Brita: 47999990000 -->\n___",
    opcoes: [
      '<a href="tel:47999990000">Ligar para Brita</a>',
      '<img src="47999990000">',
      '<p href="Brita">Ligar</p>',
    ],
    correta: 0,
    dica: "O prefixo tel: identifica um número de telefone.",
    explicacao:
      "O endereço tel: é próprio para chamadas. Aqui a ligação é uma simulação local: abra Telefone, selecione Brita e toque em Ligar.",
  },
];
function pendentes(f) {
  return DESAFIOS_NOVAS_FASES.filter(
    (d) =>
      d.etapa === f.etapa &&
      !(f.desafiosResolvidos || []).includes(d.id) &&
      (!d.precisaPaineis || f.final?.paineis.length === 2),
  );
}
export function obterDesafioNovaFase(f) {
  return pendentes(f).find((d) =>
    d.precisaPedido && !f.pedidoPendente
      ? false
      : d.gols !== undefined
        ? f.golsAxel + f.golsNaverdachi >= d.gols
        : f.tempo >= d.tempo,
  );
}
export function limitarPassoProgramacao(f, dt) {
  const futuro = pendentes(f)
    .filter(
      (d) => d.tempo !== undefined && (!d.precisaPedido || f.pedidoPendente),
    )
    .map((d) => Math.max(0, d.tempo - f.tempo));
  return Math.min(dt, ...futuro);
}
export function responderDesafioNovaFase(f, id, opcao) {
  const d = obterDesafioNovaFase(f);
  if (
    !d ||
    d.id !== id ||
    !Number.isInteger(opcao) ||
    opcao < 0 ||
    opcao >= d.opcoes.length
  )
    return { valido: false, correto: false };
  if (opcao !== d.correta)
    return { valido: true, correto: false, mensagem: "Ainda não. " + d.dica };
  f.desafiosResolvidos ??= [];
  f.desafiosResolvidos.push(id);
  return { valido: true, correto: true, mensagem: d.explicacao };
}
