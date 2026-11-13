import { ETAPAS_FINAL } from "./regras-final.js";
import { FALAS_FINAL, falaFinal, sonsFinal } from "./falas-final.js";
export const FALAS_ARCOPLEX = [
  ...FALAS_FINAL,
  [
    "mercadoEntrada",
    0.4,
    "clay-boas-vindas",
    "CLAYFACE",
    "Eu sou o Clayface. Aqui ninguém sai sem fazer as compras da lista.",
  ],
  [
    "mercadoEntrada",
    8.5,
    "joker-carrinho",
    "CORINGA",
    "E o carrinho é por nossa conta!",
  ],
  ["carrinhoAtaque", 0.1, "joker-segura", "CORINGA", "Segura esse carrinho!"],
  [
    "portaEstranha",
    2,
    "axel-porta",
    "AXEL",
    "Essa porta não estava aqui. O que tem do outro lado?",
  ],
  ["olhoMagico", 0.6, "axel-cinema", "AXEL", "Um cinema? No meio do mercado?"],
  [
    "shoppingExplorar",
    0.5,
    "axel-sozinho",
    "AXEL",
    "Onde foi parar todo mundo?",
  ],
  [
    "cinemaFuga",
    0.4,
    "axel-passos",
    "AXEL",
    "Esses passos estão vindo pra cá. Preciso me esconder.",
  ],
  ["cinemaSala", 0.4, "axel-sala", "AXEL", "A sala está vazia... Eu acho."],
  [
    "cinemaSala",
    5.5,
    "jn-abertura",
    "JORNAL NACIONAL · FICÇÃO",
    "Boa noite. Neste universo fictício, Alya Kujou e Lula participam do último debate.",
  ],
  [
    "cinemaSala",
    16,
    "alya-debate1",
    "ALYA",
    "Precisamos de metas claras. E de transparência para conferir cada decisão.",
  ],
  [
    "cinemaSala",
    24,
    "lula-debate",
    "LULA",
    "Mas como pretende cumprir todas as promessas? A resposta deve ser dada à população.",
  ],
  [
    "cinemaSala",
    33,
    "alya-debate2",
    "ALYA",
    "Com planejamento, fiscalização e prestação de contas.",
  ],
  [
    "cinemaSala",
    40,
    "jn-resultado",
    "JORNAL NACIONAL · FICÇÃO",
    "A apuração desta eleição fictícia terminou. Alya Kujou venceu com oitenta e nove vírgula setenta e quatro por cento dos votos.",
  ],
];
export function falaArcoplex(f) {
  if (ETAPAS_FINAL.includes(f.etapa)) return falaFinal(f);
  return FALAS_ARCOPLEX.filter((l) => l[0] === f.etapa && l[1] <= f.tempo).at(
    -1,
  );
}
export function sonsArcoplex(f) {
  if (ETAPAS_FINAL.includes(f.etapa)) return sonsFinal(f);
  const fala = falaArcoplex(f),
    r = fala
      ? [["arc-" + fala[2], "assets/arcoplex/falas/" + fala[2] + ".wav", 1]]
      : [];
  if (f.etapa === "compras" && f.arcoplex?.rodada === 1)
    r.push(["arc-pedido-joker", "assets/arcoplex/falas/pedido-joker.wav", 1]);
  if (
    [
      "olhoMagico",
      "travessiaCinema",
      "shoppingExplorar",
      "cinemaFuga",
      "cinemaSala",
      "cinemaResultado",
    ].includes(f.etapa)
  )
    r.push(["arc-ambiente", "assets/arcoplex/ambiente.m4a", 0.35, true]);
  return r;
}
