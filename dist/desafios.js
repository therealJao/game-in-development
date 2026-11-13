// APRENDER HTML/CSS — perguntas, três alternativas, dicas e explicações.
import { NOMES } from "./configuracao.js";
// Desafios para iniciantes: uma tag, atributo ou valor por vez.
export const DESAFIOS_TERMINAIS = [
  [
    {
      title: "Um título bem grande.",
      description: "Qual tag cria o título principal? Escolha ou digite a tag de abertura.",
      language: "HTML",
      type: "tag",
      before: "<!-- Título principal -->\n",
      after: "\nEscape Code\n</h1>",
      solution: "<h1>",
      choices: ["<h1>", "<p>", "<img>"],
      mostrarDica: "O h vem de heading (título). O número 1 indica o título principal.",
      explanation: "<h1> cria o título principal. </h1> fecha esse título.",
    },
    {
      title: "Uma frase na página.",
      description: "Complete com a tag de abertura de um parágrafo.",
      language: "HTML",
      type: "tag",
      before: "<!-- Um parágrafo -->\n",
      after: `
${NOMES.cachorro} está com você.
</p>`,
      solution: "<p>",
      choices: ["<h1>", "<p>", "<button>"],
      mostrarDica: "Parágrafo começa com p.",
      explanation: "<p> marca um parágrafo de texto, e </p> encerra o parágrafo.",
    },
  ],
  [
    {
      title: "Texto vermelho.",
      description: "color muda a cor das letras. Complete com a palavra em inglês para vermelho.",
      language: "CSS",
      type: "value",
      before: "p {\n  color: ",
      after: ";\n}",
      solution: "red",
      accepted: ["#ff0000", "#f00", "rgb(255,0,0)"],
      choices: ["red", "blue", "green"],
      mostrarDica: "Vermelho em inglês é red.",
      explanation: "color: red; deixa o texto vermelho.",
    },
    {
      title: "Um fundo azul.",
      description: "background-color muda o fundo. Escolha a palavra em inglês para azul.",
      language: "CSS",
      type: "value",
      before: "body {\n  background-color: ",
      after: ";\n}",
      solution: "blue",
      accepted: ["#0000ff", "#00f", "rgb(0,0,255)"],
      choices: ["red", "blue", "white"],
      mostrarDica: "Azul em inglês é blue.",
      explanation: "background-color: blue; coloca um fundo azul na página.",
    },
  ],
  [
    {
      title: `Mostre o ${NOMES.cachorro}.`,
      description:
        "Na tag img, qual atributo indica o arquivo da imagem? Complete com uma palavra.",
      language: "HTML",
      type: "word",
      before: "<img ",
      after: `="${NOMES.cachorro}.png" alt="${NOMES.cachorro}">`,
      solution: "src",
      choices: ["color", "href", "src"],
      mostrarDica: "O nome vem de source (origem): src.",
      explanation: "src indica o caminho do arquivo que a tag img vai mostrar.",
    },
    {
      title: "Letras maiores.",
      description: "font-size muda o tamanho das letras. Escolha 20 pixels.",
      language: "CSS",
      type: "value",
      before: "h1 {\n  font-size: ",
      after: ";\n}",
      solution: "20px",
      choices: ["20px", "red", "center"],
      mostrarDica: "Pixel é abreviado como px. Junte 20 e px.",
      explanation: "font-size: 20px; define o tamanho das letras em 20 pixels.",
    },
  ],
];
const criarDesafioSimples = (title, language, before, after, solution, choices, explanation) => ({
  title,
  language,
  before,
  after,
  solution,
  choices,
  description: title + " Escolha ou digite a resposta.",
  type: "value",
  mostrarDica: explanation,
  explanation,
});
export const DESAFIOS_ALTERNATIVOS = [
  [
    criarDesafioSimples(
      "Um botão para escapar.",
      "HTML",
      "",
      "SAIR</button>",
      "<button>",
      ["<p>", "<button>", "<h1>"],
      "<button> cria um botão clicável.",
    ),
    criarDesafioSimples(
      "Um link para outra página.",
      "HTML",
      "<a ",
      '="saida.html">Saída</a>',
      "href",
      ["src", "color", "href"],
      "href informa o destino de um link.",
    ),
  ],
  [
    criarDesafioSimples(
      "Centralize o título.",
      "CSS",
      "h1 { text-align: ",
      "; }",
      "center",
      ["left", "center", "red"],
      "text-align: center; centraliza o texto.",
    ),
    criarDesafioSimples(
      "Deixe o texto branco.",
      "CSS",
      "p { color: ",
      "; }",
      "white",
      ["white", "black", "blue"],
      "color: white; deixa as letras brancas.",
    ),
  ],
  [
    criarDesafioSimples(
      "Texto em negrito.",
      "CSS",
      "p { font-weight: ",
      "; }",
      "bold",
      ["center", "red", "bold"],
      "font-weight: bold; deixa o texto em negrito.",
    ),
    criarDesafioSimples(
      "Uma imagem na página.",
      "HTML",
      "",
      ` src="${NOMES.cachorro}.png" alt="${NOMES.cachorro}">`,
      "<img",
      ["<a", "<img", "<p"],
      "A tag img mostra uma imagem. O sinal > já está no código.",
    ),
  ],
];
export const DESAFIOS_RECUPERACAO = [
  criarDesafioSimples(
    "Destaque uma palavra.",
    "HTML",
    "",
    "Cuidado!</strong>",
    "<strong>",
    ["<strong>", "<p>", "<img>"],
    "<strong> destaca um texto importante, geralmente em negrito.",
  ),
  criarDesafioSimples(
    "Um fundo preto.",
    "CSS",
    "body { background-color: ",
    "; }",
    "black",
    ["green", "black", "red"],
    "background-color: black; deixa o fundo preto.",
  ),
  criarDesafioSimples(
    "Espaço dentro do botão.",
    "CSS",
    "button { padding: ",
    "; }",
    "10px",
    ["red", "center", "10px"],
    "padding: 10px; cria dez pixels de espaço interno.",
  ),
];
export function obterDesafioTerminal(chapter, index, variant = 0) {
  return (variant % 2 ? DESAFIOS_ALTERNATIVOS : DESAFIOS_TERMINAIS)[chapter][index];
}
export function obterDesafioRecuperacao(chapter) {
  return DESAFIOS_RECUPERACAO[chapter];
}
export /* Compara uma resposta curta de HTML/CSS com as soluções aceitas. */
function validarResposta(challenge, source) {
  const raw = String(source).trim();
  if (!raw)
    return {
      ok: false,
      message: "Escolha uma das três opções, ou digite a resposta.",
    };
  const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, "");
  const valid = [challenge.solution, ...(challenge.accepted || [])].some(
    (answer) => normalize(answer) === normalize(raw),
  );
  return valid
    ? {
        ok: true,
        message: challenge.explanation,
      }
    : {
        ok: false,
        message: `Ainda não. ${challenge.mostrarDica} Você pode tocar na opção correta.`,
      };
}
